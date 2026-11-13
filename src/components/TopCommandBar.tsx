import { Pause, Play } from 'lucide-react';
import { ScreenId } from '../types/traffic';

interface TopCommandBarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  isLive: boolean;
  onToggleLive: () => void;
}

const NAV_ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'command-map', label: 'Command Map' },
  { id: 'corridor-analytics', label: 'Corridor Analytics' },
  { id: 'fleet-dispatch', label: 'Fleet Dispatch' },
  { id: 'policy-controls', label: 'Grid Policies' },
];

export function TopCommandBar({
  activeScreen,
  onSelectScreen,
  isLive,
  onToggleLive,
}: TopCommandBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#00f0ff]/20 bg-[#0a0e17]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectScreen('command-map')}
          className="font-display text-lg font-bold tracking-tight text-[#dbfcff] whitespace-nowrap shrink-0 hover:text-[#00f0ff] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00f0ff]"
        >
          Vectra Grid
        </button>

        {/* Zone 2: 4 Single-line screen navigation links */}
        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                className={`relative py-1.5 text-xs font-medium tracking-wider whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00f0ff] ${
                  active
                    ? 'text-[#00f0ff]'
                    : 'text-[#b9cacb] hover:text-[#dfe2ef]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-[2px] bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleLive}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00f0ff] ${
              isLive
                ? 'bg-[#00f0ff] text-[#002022] border border-[#7df4ff] shadow-[0_0_15px_rgba(0,240,255,0.28)] hover:bg-[#7df4ff]'
                : 'bg-transparent text-[#00f0ff] border border-[#00f0ff]/70 hover:bg-[#00f0ff]/10'
            }`}
          >
            {isLive ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Pause Feed</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Resume Feed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile horizontal nav bar (only visible under md) */}
      <nav
        aria-label="Mobile sections"
        className="flex md:hidden items-center gap-1 overflow-x-auto border-t border-[#3b494b]/50 px-4 py-1.5"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectScreen(item.id)}
              className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40'
                  : 'text-[#b9cacb] hover:text-[#dfe2ef]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
