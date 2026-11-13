import { AlertTriangle, Check, Cpu, RotateCcw } from 'lucide-react';
import { AutonomyMode, GridPolicyState, ScenarioId } from '../types/traffic';

interface PolicyControlsScreenProps {
  policy: GridPolicyState;
  activeScenario: ScenarioId;
  onUpdatePolicy: (patch: Partial<GridPolicyState>, logMsg?: string) => void;
  onTriggerScenario: (scenario: ScenarioId) => void;
}

const AUTONOMY_MODES: {
  id: AutonomyMode;
  title: string;
  desc: string;
}[] = [
  {
    id: 'AUTONOMOUS',
    title: 'Full AI Autonomous',
    desc: 'Neural planner dynamically balances signal timing and reroutes corridors automatically.',
  },
  {
    id: 'SUPERVISED',
    title: 'Supervised Override',
    desc: 'AI recommends timing shifts while preserving operator-locked corridor priorities.',
  },
  {
    id: 'MANUAL_HOLD',
    title: 'Manual Grid Lock',
    desc: 'Freezes automated phase adaptation; all intersections follow fixed operator schedules.',
  },
];

const SCENARIOS: {
  id: ScenarioId;
  title: string;
  impact: string;
  accent: string;
}[] = [
  {
    id: 'NOMINAL',
    title: 'Nominal Flow Baseline',
    impact: 'Resets all 8 intersections and 11 corridors to standard off-peak parameters.',
    accent: 'border-[#00fe66]/50 text-[#00fe66]',
  },
  {
    id: 'RUSH_SURGE',
    title: 'Rush Hour Surge',
    impact: 'Simulates +32% commuter density and elevated pedestrian crosswalk demand.',
    accent: 'border-[#ffb800]/50 text-[#ffb800]',
  },
  {
    id: 'TUNNEL_BOTTLENECK',
    title: 'Harbor Tunnel Bottleneck',
    impact: 'Triggers critical queue buildup at N-07 Harbor Tunnel and engages All-Red hold.',
    accent: 'border-[#ff2a5f]/60 text-[#ff2a5f]',
  },
  {
    id: 'EMERGENCY_CONVOY',
    title: 'Emergency Priority Convoy',
    impact: 'Locks continuous cyan Green-Wave across Metro Spine to Bayfront Causeway.',
    accent: 'border-[#00f0ff]/60 text-[#00f0ff]',
  },
];

export function PolicyControlsScreen({
  policy,
  activeScenario,
  onUpdatePolicy,
  onTriggerScenario,
}: PolicyControlsScreenProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#00f0ff]/20 pb-4">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-[#00f0ff]">
            System Operator Thresholds & Stress Testing
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#dbfcff]">
            Grid Policies & Incident Simulator
          </h1>
        </div>

        <button
          type="button"
          onClick={() => onTriggerScenario('NOMINAL')}
          className="inline-flex items-center gap-2 border border-[#00f0ff]/50 bg-transparent px-4 py-2 text-xs font-semibold text-[#00f0ff] hover:bg-[#00f0ff]/10 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Restore Nominal Grid</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Autonomy Mode & Automated Protocols (7 cols) */}
        <section className="lg:col-span-7 hud-glass border-t-2 border-t-[#00f0ff] p-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-4 w-4 text-[#00f0ff]" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold text-[#dbfcff]">
                Control Authority Mode
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AUTONOMY_MODES.map((mode) => {
                const selected = policy.autonomyMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      onUpdatePolicy(
                        { autonomyMode: mode.id },
                        `Control authority switched to ${mode.title}.`
                      )
                    }
                    className={`text-left p-3.5 border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#00f0ff]/15 border-[#00f0ff] hud-glow-cyan'
                        : 'bg-[#0a0e17] border-[#3b494b] hover:border-[#00f0ff]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#dbfcff]">
                        {mode.title}
                      </span>
                      {/* Sharp Diamond Radio Indicator */}
                      <span
                        aria-hidden="true"
                        className={`h-3 w-3 rotate-45 border ${
                          selected
                            ? 'bg-[#00f0ff] border-[#dbfcff]'
                            : 'border-[#849495]'
                        }`}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#b9cacb]">
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sharp Square Protocol Checkboxes */}
          <div>
            <h3 className="font-display text-sm font-semibold text-[#dbfcff] mb-3">
              Automated Safety & Routing Protocols
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    key: 'dynamicGreenWave',
                    label: 'Dynamic Green-Wave Sync',
                    sub: 'Align downstream phase offsets for arterial platoons',
                  },
                  {
                    key: 'emergencyPreemption',
                    label: 'Emergency Preemption',
                    sub: 'Clear intersections 400m ahead of active trauma units',
                  },
                  {
                    key: 'pedestrianSafetyBuffer',
                    label: 'Pedestrian All-Clear Buffer',
                    sub: 'Extend clearance intervals when crosswalk density > 60 pax',
                  },
                  {
                    key: 'ecoSpeedHarmonization',
                    label: 'Eco-Speed Harmonization',
                    sub: 'Dampen stop-and-go waves on freight corridors',
                  },
                ] as const
              ).map((item) => {
                const checked = policy[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      onUpdatePolicy(
                        { [item.key]: !checked },
                        `${item.label} ${!checked ? 'enabled' : 'disabled'}.`
                      )
                    }
                    className={`flex items-start gap-3 p-3 border text-left transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#181b25] border-[#00f0ff]/50'
                        : 'bg-[#0a0e17] border-[#3b494b] hover:border-[#849495]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                        checked
                          ? 'bg-[#00f0ff] border-[#dbfcff] text-[#002022]'
                          : 'bg-[#0a0e17] border-[#849495]'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-[#dfe2ef]">
                        {item.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#849495]">
                        {item.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Segmented Sliders */}
          <div className="space-y-4 border-t border-[#00f0ff]/20 pt-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="reroute-sens" className="text-[#dfe2ef] font-medium">
                  Congestion Reroute Sensitivity
                </label>
                <span className="text-[#00f0ff] font-bold tabular-nums">
                  {policy.rerouteSensitivity}%
                </span>
              </div>
              <input
                id="reroute-sens"
                type="range"
                min={10}
                max={100}
                value={policy.rerouteSensitivity}
                onChange={(e) =>
                  onUpdatePolicy({ rerouteSensitivity: Number(e.target.value) })
                }
                className="cyber-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="max-queue" className="text-[#dfe2ef] font-medium">
                  Maximum Queue Tolerance Before Override
                </label>
                <span className="text-[#00f0ff] font-bold tabular-nums">
                  {policy.maxQueueTolerance} vehicles
                </span>
              </div>
              <input
                id="max-queue"
                type="range"
                min={10}
                max={60}
                value={policy.maxQueueTolerance}
                onChange={(e) =>
                  onUpdatePolicy({ maxQueueTolerance: Number(e.target.value) })
                }
                className="cyber-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="adapt-rate" className="text-[#dfe2ef] font-medium">
                  Signal Cycle Adaptation Gain
                </label>
                <span className="text-[#00f0ff] font-bold tabular-nums">
                  Level {policy.cycleAdaptationRate} / 10
                </span>
              </div>
              <input
                id="adapt-rate"
                type="range"
                min={1}
                max={10}
                value={policy.cycleAdaptationRate}
                onChange={(e) =>
                  onUpdatePolicy({ cycleAdaptationRate: Number(e.target.value) })
                }
                className="cyber-slider"
              />
            </div>
          </div>
        </section>

        {/* Scenario Stress Simulator (5 cols) */}
        <section className="lg:col-span-5 hud-glass-violet border-t-2 border-t-[#ffb800] p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-[#ffb800]" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-[#fcf3ff]">
              Urban Incident Simulator
            </h2>
          </div>
          <p className="text-xs text-[#b9cacb] mb-4">
            Inject live traffic anomalies across all screens to validate AI corridor resilience.
          </p>

          <div className="space-y-3 flex-1">
            {SCENARIOS.map((sc) => {
              const active = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onTriggerScenario(sc.id)}
                  className={`w-full text-left p-4 border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#220844]/70 border-[#00f0ff] hud-glow-cyan'
                      : 'bg-[#0a0e17] border-[#3b494b] hover:border-[#d6baff]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-[#fcf3ff]">
                      {sc.title}
                    </span>
                    <span
                      className={`border px-2 py-0.5 text-[10px] font-semibold ${sc.accent}`}
                    >
                      {active ? 'ACTIVE' : 'RUN'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#b9cacb] leading-relaxed">
                    {sc.impact}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
