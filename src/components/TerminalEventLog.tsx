import { useMemo, useState } from 'react';
import { LogSeverity, TerminalLogEntry } from '../types/traffic';

interface TerminalEventLogProps {
  logs: TerminalLogEntry[];
}

export function TerminalEventLog({ logs }: TerminalEventLogProps) {
  const [filter, setFilter] = useState<'ALL' | LogSeverity>('ALL');

  const filteredLogs = useMemo(() => {
    if (filter === 'ALL') return logs;
    return logs.filter((item) => item.severity === filter);
  }, [filter, logs]);

  return (
    <section className="hud-glass flex flex-col border-t-2 border-t-[#00f0ff]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f0ff]/20 px-4 py-2.5 bg-[#0f131c]/80">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-[#dbfcff]">
            Grid Event Log
          </h2>
          <span className="text-[11px] text-[#849495] tabular-nums">
            {filteredLogs.length} events
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#0a0e17] p-0.5 border border-[#3b494b]">
          {(['ALL', 'INFO', 'WARNING', 'OVERRIDE'] as const).map((level) => {
            const active = filter === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setFilter(level)}
                className={`px-2.5 py-1 text-[10px] font-medium tracking-wider whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#849495] hover:text-[#dfe2ef] border border-transparent'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-[#3b494b]/35 px-4 py-1">
        {filteredLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#849495]">
            No events matching severity filter {filter}.
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const severityColor =
              entry.severity === 'OVERRIDE'
                ? 'text-[#ff2a5f] bg-[#ff2a5f]/15 border-[#ff2a5f]/40'
                : entry.severity === 'WARNING'
                ? 'text-[#ffb800] bg-[#ffb800]/15 border-[#ffb800]/40'
                : 'text-[#00f0ff] bg-[#00f0ff]/12 border-[#00f0ff]/35';

            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 py-2 text-xs leading-relaxed"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#849495] tabular-nums">
                    {entry.timestamp}
                  </span>
                  <span className="text-[#b9cacb] font-medium w-16 truncate">
                    {entry.sector}
                  </span>
                  <span
                    className={`inline-block border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider ${severityColor}`}
                  >
                    {entry.severity}
                  </span>
                </div>
                <p className="text-[#dfe2ef] text-[12px]">{entry.message}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
