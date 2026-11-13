import { GitBranch, ShieldAlert, Sliders } from 'lucide-react';
import { IntersectionNode, SignalPhase } from '../types/traffic';
import { getPhaseLabel, getStatusMeta } from './StatusReadout';

interface NodeInspectorPanelProps {
  node: IntersectionNode;
  onOverridePhase: (nodeId: string, phase: SignalPhase | 'AUTO') => void;
  onUpdateThreshold: (nodeId: string, threshold: number) => void;
  onRerouteCorridors: (nodeId: string) => void;
}

export function NodeInspectorPanel({
  node,
  onOverridePhase,
  onUpdateThreshold,
  onRerouteCorridors,
}: NodeInspectorPanelProps) {
  const statusMeta = getStatusMeta(node.status);

  return (
    <aside className="hud-glass flex flex-col border-t-2 border-t-[#00f0ff] hud-glow-cyan">
      {/* Chamfered header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#00f0ff]/20 bg-[#0f131c]/90 px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#849495] tabular-nums">
            <span>{node.code}</span>
            <span>·</span>
            <span>{node.sector}</span>
            <span>·</span>
            <span>
              {node.lat.toFixed(4)}°N, {node.lng.toFixed(4)}°E
            </span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold text-[#dbfcff]">
            {node.name}
          </h2>
        </div>

        <span
          className={`inline-block border px-2 py-1 text-[10px] font-semibold tracking-wider whitespace-nowrap shrink-0 ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* Live Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 gap-px bg-[#00f0ff]/15 border-b border-[#00f0ff]/20">
        <div className="bg-[#131b2e]/95 px-4 py-3">
          <div className="text-[10px] text-[#849495] tracking-wider">
            Active Phase
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-[#00f0ff]">
              {getPhaseLabel(node.phase)}
            </span>
            <span className="text-sm font-bold text-[#dbfcff] tabular-nums">
              {node.phaseRemainingSec}s
            </span>
          </div>
        </div>

        <div className="bg-[#131b2e]/95 px-4 py-3">
          <div className="text-[10px] text-[#849495] tracking-wider">
            Queue Depth
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span
              className={`text-sm font-bold tabular-nums ${
                node.queueDepth >= 38
                  ? 'text-[#ff2a5f]'
                  : node.queueDepth >= 25
                  ? 'text-[#ffb800]'
                  : 'text-[#00fe66]'
              }`}
            >
              {node.queueDepth} veh
            </span>
            <span className="text-[11px] text-[#b9cacb] tabular-nums">
              {node.pedestrianCount} pax
            </span>
          </div>
        </div>

        <div className="bg-[#131b2e]/95 px-4 py-3">
          <div className="text-[10px] text-[#849495] tracking-wider">
            Corridor Velocity
          </div>
          <div className="mt-1 text-sm font-bold text-[#dfe2ef] tabular-nums">
            {node.avgSpeedKmh} km/h
          </div>
        </div>

        <div className="bg-[#131b2e]/95 px-4 py-3">
          <div className="text-[10px] text-[#849495] tracking-wider">
            AI Confidence
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-[#00fe66] tabular-nums">
              {node.aiConfidence}%
            </span>
            <span className="text-[10px] text-[#849495] tabular-nums">
              {node.throughputVph} vph
            </span>
          </div>
        </div>
      </div>

      {/* Operator Controls */}
      <div className="flex flex-col gap-5 p-4">
        {/* Manual Signal Override Matrix */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#dfe2ef]">
              <ShieldAlert className="h-3.5 w-3.5 text-[#00f0ff]" aria-hidden="true" />
              <span>Signal Phase Override</span>
            </div>
            <span className="text-[10px] text-[#b9cacb]">
              {node.manualOverride ? 'MANUAL LOCK' : 'AI SCHEDULED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOverridePhase(node.id, 'NS_GREEN')}
              className={`px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                node.manualOverride && node.phase === 'NS_GREEN'
                  ? 'bg-[#00fe66]/20 border-[#00fe66] text-[#ebffe6]'
                  : 'bg-[#0a0e17] border-[#3b494b] text-[#b9cacb] hover:border-[#00f0ff] hover:text-[#dbfcff]'
              }`}
            >
              Hold N/S Green
            </button>
            <button
              type="button"
              onClick={() => onOverridePhase(node.id, 'EW_GREEN')}
              className={`px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                node.manualOverride && node.phase === 'EW_GREEN'
                  ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#dbfcff]'
                  : 'bg-[#0a0e17] border-[#3b494b] text-[#b9cacb] hover:border-[#00f0ff] hover:text-[#dbfcff]'
              }`}
            >
              Hold E/W Green
            </button>
            <button
              type="button"
              onClick={() => onOverridePhase(node.id, 'ALL_RED')}
              className={`px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                node.manualOverride && node.phase === 'ALL_RED'
                  ? 'bg-[#ff2a5f]/25 border-[#ff2a5f] text-[#ffdad6]'
                  : 'bg-[#0a0e17] border-[#3b494b] text-[#ffb4ab] hover:border-[#ff2a5f] hover:bg-[#ff2a5f]/10'
              }`}
            >
              All-Red Safety Hold
            </button>
            <button
              type="button"
              onClick={() => onOverridePhase(node.id, 'AUTO')}
              className={`px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                !node.manualOverride
                  ? 'bg-[#00f0ff]/15 border-[#00f0ff]/60 text-[#00f0ff]'
                  : 'bg-[#0a0e17] border-[#3b494b] text-[#dfe2ef] hover:border-[#00f0ff]'
              }`}
            >
              Restore AI Auto
            </button>
          </div>
        </div>

        {/* Segmented Intervention Threshold Slider */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor={`threshold-${node.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#dfe2ef]"
            >
              <Sliders className="h-3.5 w-3.5 text-[#00f0ff]" aria-hidden="true" />
              <span>AI Intervention Threshold</span>
            </label>
            <span className="text-xs font-bold text-[#00f0ff] tabular-nums">
              {node.interventionThreshold}%
            </span>
          </div>
          <input
            id={`threshold-${node.id}`}
            type="range"
            min={40}
            max={95}
            step={1}
            value={node.interventionThreshold}
            onChange={(e) => onUpdateThreshold(node.id, Number(e.target.value))}
            className="cyber-slider"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[#849495] tabular-nums">
            <span>40% Sensitive</span>
            <span>95% Strict</span>
          </div>
        </div>

        {/* Primary Corridor Reroute CTA */}
        <button
          type="button"
          onClick={() => onRerouteCorridors(node.id)}
          className="hud-chamfer-sm inline-flex w-full items-center justify-center gap-2 bg-[#00f0ff] px-4 py-2.5 text-xs font-bold tracking-wider text-[#002022] border border-[#7df4ff] shadow-[0_0_15px_rgba(0,240,255,0.22)] hover:bg-[#7df4ff] transition-colors cursor-pointer"
        >
          <GitBranch className="h-4 w-4" aria-hidden="true" />
          <span>Reroute Inbound Corridors</span>
        </button>
      </div>
    </aside>
  );
}
