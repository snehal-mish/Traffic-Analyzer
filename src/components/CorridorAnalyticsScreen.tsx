import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { HOURLY_FLUX_DATA } from '../data/initialGrid';
import { IntersectionNode, NodeStatus, TrafficCorridor } from '../types/traffic';
import { getPhaseLabel, getStatusMeta } from './StatusReadout';

interface CorridorAnalyticsScreenProps {
  nodes: IntersectionNode[];
  corridors: TrafficCorridor[];
  onUpdateNodeCycle: (nodeId: string, cycleLengthSec: number) => void;
  onSelectNodeAndJump: (nodeId: string) => void;
}

type TimeRange = '6H' | '12H' | '24H';

export function CorridorAnalyticsScreen({
  nodes,
  corridors,
  onUpdateNodeCycle,
  onSelectNodeAndJump,
}: CorridorAnalyticsScreenProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | NodeStatus>('ALL');

  const chartPoints = useMemo(() => {
    if (timeRange === '6H') return HOURLY_FLUX_DATA.slice(-4);
    if (timeRange === '12H') return HOURLY_FLUX_DATA.slice(-7);
    return HOURLY_FLUX_DATA;
  }, [timeRange]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesStatus = statusFilter === 'ALL' || n.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        n.name.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q) ||
        n.sector.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [nodes, searchQuery, statusFilter]);

  const handleExportCsv = () => {
    const headers = [
      'Code',
      'Intersection',
      'Sector',
      'Status',
      'Phase',
      'Remaining_Sec',
      'Cycle_Sec',
      'Queue_Depth',
      'Throughput_VPH',
      'Avg_Speed_Kmh',
      'AI_Confidence_Pct',
    ];
    const rows = nodes.map((n) => [
      n.code,
      `"${n.name}"`,
      `"${n.sector}"`,
      n.status,
      n.phase,
      n.phaseRemainingSec,
      n.cycleLengthSec,
      n.queueDepth,
      n.throughputVph,
      n.avgSpeedKmh,
      n.aiConfidence,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vectra-grid-telemetry-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // SVG Chart geometry
  const svgW = 760;
  const svgH = 230;
  const padX = 48;
  const padY = 24;
  const innerW = svgW - padX * 2;
  const innerH = svgH - padY * 2;
  const maxVal = 20000;

  const toX = (idx: number) =>
    padX + (chartPoints.length <= 1 ? 0 : (idx / (chartPoints.length - 1)) * innerW);
  const toY = (val: number) => padY + innerH - (val / maxVal) * innerH;

  const observedLine = chartPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(pt.observedFlow).toFixed(1)}`)
    .join(' ');
  const predictedLine = chartPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(pt.aiPredictedFlow).toFixed(1)}`)
    .join(' ');
  const observedArea = `${observedLine} L ${toX(chartPoints.length - 1).toFixed(1)} ${(
    padY + innerH
  ).toFixed(1)} L ${toX(0).toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

  const activeHoverPoint =
    hoverIdx !== null && chartPoints[hoverIdx] ? chartPoints[hoverIdx] : null;

  return (
    <div className="space-y-4">
      {/* Screen Header & Action Row */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d6baff]/25 pb-4">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-[#d6baff]">
            Regional Sector Analytics · {corridors.length} Active Corridors
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#fcf3ff]">
            Corridor Flux & Signal Timing Matrix
          </h1>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="hud-chamfer-sm inline-flex items-center gap-2 border border-[#00f0ff] bg-transparent px-4 py-2 text-xs font-semibold tracking-wider text-[#00f0ff] hover:bg-[#00f0ff]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Export Telemetry CSV</span>
        </button>
      </div>

      {/* Top Grid: 24H Flux Chart + Corridor Load Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Dual-Series Flux Chart (8 cols) */}
        <section className="lg:col-span-8 hud-glass-violet border-t-2 border-t-[#d6baff] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-[#fcf3ff]">
                Observed Flow vs. AI Predicted Load
              </h2>
              <p className="text-[11px] text-[#b9cacb]">
                Vehicles per hour across all urban arterials
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#0a0e17] p-0.5 border border-[#3b494b]">
              {(['6H', '12H', '24H'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors ${
                    timeRange === range
                      ? 'bg-[#220844] text-[#ecdcff] border border-[#d6baff]/60'
                      : 'text-[#849495] hover:text-[#dfe2ef] border border-transparent'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full min-w-[540px] h-auto block"
              role="img"
              aria-label="Observed traffic flow versus AI predicted load chart"
            >
              <defs>
                <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal gridlines */}
              {[0, 5000, 10000, 15000, 20000].map((tick) => {
                const y = toY(tick);
                return (
                  <g key={tick}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={svgW - padX}
                      y2={y}
                      stroke="rgba(214, 186, 255, 0.14)"
                      strokeDasharray="3 4"
                    />
                    <text
                      x={padX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#849495"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {tick === 0 ? '0' : `${tick / 1000}k`}
                    </text>
                  </g>
                );
              })}

              {/* Area + Lines */}
              <path d={observedArea} fill="url(#cyanArea)" />
              <path
                d={predictedLine}
                fill="none"
                stroke="#d6baff"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <path d={observedLine} fill="none" stroke="#00f0ff" strokeWidth="2.5" />

              {/* Interactive nodes & hover hit zones */}
              {chartPoints.map((pt, i) => {
                const cx = toX(i);
                const cyObs = toY(pt.observedFlow);
                const cyPred = toY(pt.aiPredictedFlow);
                const hovered = hoverIdx === i;

                return (
                  <g
                    key={pt.hourLabel}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    className="cursor-crosshair"
                  >
                    <rect
                      x={cx - innerW / (chartPoints.length * 2)}
                      y={padY}
                      width={innerW / Math.max(1, chartPoints.length)}
                      height={innerH}
                      fill="transparent"
                    />
                    {hovered && (
                      <line
                        x1={cx}
                        y1={padY}
                        x2={cx}
                        y2={padY + innerH}
                        stroke="rgba(0, 240, 255, 0.5)"
                      />
                    )}
                    <rect
                      x={cx - 3.5}
                      y={cyObs - 3.5}
                      width={7}
                      height={7}
                      fill={hovered ? '#dbfcff' : '#00f0ff'}
                    />
                    <rect
                      x={cx - 3}
                      y={cyPred - 3}
                      width={6}
                      height={6}
                      fill="#d6baff"
                    />
                    <text
                      x={cx}
                      y={svgH - 4}
                      textAnchor="middle"
                      fill={hovered ? '#00f0ff' : '#849495'}
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {pt.hourLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Chart Legend & Hover Scrub Readout */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#d6baff]/20 pt-3 text-xs tabular-nums">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 bg-[#00f0ff]" />
                <span className="text-[#dfe2ef]">Observed Flow (vph)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 bg-[#d6baff]" />
                <span className="text-[#b9cacb]">AI Predicted Baseline</span>
              </div>
            </div>

            {activeHoverPoint ? (
              <div className="text-[#00f0ff]">
                {activeHoverPoint.hourLabel} · Observed{' '}
                {activeHoverPoint.observedFlow.toLocaleString()} vph · Predicted{' '}
                {activeHoverPoint.aiPredictedFlow.toLocaleString()} vph ·{' '}
                {activeHoverPoint.avgSpeedKmh} km/h
              </div>
            ) : (
              <div className="text-[#849495]">Hover timeline nodes to inspect hourly delta</div>
            )}
          </div>
        </section>

        {/* Corridor Congestion Breakdown (4 cols) */}
        <section className="lg:col-span-4 hud-glass border-t-2 border-t-[#00fe66] p-4 flex flex-col">
          <h2 className="font-display text-base font-semibold text-[#dbfcff]">
            Corridor Load Vectors
          </h2>
          <p className="text-[11px] text-[#849495] mb-3">
            Live arterial saturation & velocity
          </p>

          <div className="space-y-3 overflow-y-auto max-h-[290px] pr-1">
            {corridors.map((cor) => {
              const barColor =
                cor.emergencyGreenWave || cor.aiRerouted
                  ? 'bg-[#00f0ff]'
                  : cor.loadPct >= 80
                  ? 'bg-[#ff2a5f]'
                  : cor.loadPct >= 62
                  ? 'bg-[#ffb800]'
                  : 'bg-[#00fe66]';

              return (
                <div key={cor.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <span className="text-[#dfe2ef] font-medium truncate pr-2">
                      {cor.name}
                    </span>
                    <span className="text-[#b9cacb] shrink-0">
                      {cor.loadPct}% · {cor.velocityKmh} km/h
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#0a0e17] border border-[#3b494b]/70">
                    <div
                      className={`h-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${cor.loadPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Intersection Signal Timing Matrix Table */}
      <section className="hud-glass border-t-2 border-t-[#00f0ff]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f0ff]/20 px-4 py-3 bg-[#0f131c]/80">
          <h2 className="font-display text-base font-semibold text-[#dbfcff]">
            Intersection Signal Timing Matrix
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#849495]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter node or sector..."
                aria-label="Filter intersections"
                className="w-52 bg-[#0a0e17] border border-[#3b494b] pl-8 pr-3 py-1.5 text-xs text-[#dfe2ef] placeholder-[#849495] focus:border-[#00f0ff] focus:outline-none"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#0a0e17] p-0.5 border border-[#3b494b]">
              {(['ALL', 'OPTIMAL', 'ACTIVE_AI', 'ELEVATED', 'CRITICAL'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 text-[10px] font-medium whitespace-nowrap cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                        : 'text-[#849495] hover:text-[#dfe2ef] border border-transparent'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs tabular-nums">
            <thead>
              <tr className="border-b border-[#3b494b]/60 bg-[#0a0e17]/80 text-[10px] uppercase tracking-wider text-[#849495]">
                <th className="py-2.5 px-4 font-medium">Node</th>
                <th className="py-2.5 px-4 font-medium">Sector</th>
                <th className="py-2.5 px-4 font-medium">State</th>
                <th className="py-2.5 px-4 font-medium">Phase / Timer</th>
                <th className="py-2.5 px-4 font-medium text-right">Queue</th>
                <th className="py-2.5 px-4 font-medium text-right">Speed</th>
                <th className="py-2.5 px-4 font-medium text-right">Throughput</th>
                <th className="py-2.5 px-4 font-medium">Cycle Duration</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3b494b]/40">
              {filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#849495]">
                    No intersections match the active search or status filter.
                  </td>
                </tr>
              ) : (
                filteredNodes.map((node) => {
                  const meta = getStatusMeta(node.status);
                  return (
                    <tr
                      key={node.id}
                      className="hover:bg-[#1c1f29]/70 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-medium text-[#dbfcff] whitespace-nowrap">
                        {node.code} · {node.name}
                      </td>
                      <td className="py-2.5 px-4 text-[#b9cacb] whitespace-nowrap">
                        {node.sector}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block border px-1.5 py-0.5 text-[10px] font-semibold ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-[#00f0ff]">
                        {getPhaseLabel(node.phase)} ({node.phaseRemainingSec}s)
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-[#dfe2ef]">
                        {node.queueDepth} veh
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#dfe2ef]">
                        {node.avgSpeedKmh} km/h
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#00fe66]">
                        {node.throughputVph.toLocaleString()} vph
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={44}
                            max={96}
                            step={4}
                            value={node.cycleLengthSec}
                            aria-label={`Signal cycle duration for ${node.name}`}
                            onChange={(e) =>
                              onUpdateNodeCycle(node.id, Number(e.target.value))
                            }
                            className="cyber-slider w-24"
                          />
                          <span className="text-[11px] text-[#b9cacb] w-8">
                            {node.cycleLengthSec}s
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectNodeAndJump(node.id)}
                          className="border border-[#00f0ff]/50 px-2.5 py-1 text-[11px] text-[#00f0ff] hover:bg-[#00f0ff]/15 cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
