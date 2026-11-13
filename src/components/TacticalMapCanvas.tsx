import { useEffect, useRef, useState } from 'react';
import { Crosshair, Maximize2, RotateCcw } from 'lucide-react';
import { IntersectionNode, TrafficCorridor } from '../types/traffic';
import { getPhaseLabel, getStatusMeta } from './StatusReadout';

interface TacticalMapCanvasProps {
  nodes: IntersectionNode[];
  corridors: TrafficCorridor[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  isLive: boolean;
}

type SectorFilter = 'ALL' | 'Sector Alpha' | 'Core Metro' | 'Sector Beta' | 'Bayfront';

export function TacticalMapCanvas({
  nodes,
  corridors,
  selectedNodeId,
  onSelectNode,
  isLive,
}: TacticalMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({
    lat: '35.6895° N',
    lng: '139.6917° E',
  });
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('ALL');
  const [showGridLabels, setShowGridLabels] = useState<boolean>(true);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  // Animate flowing autonomous traffic packets along corridors on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let phaseTick = 0;

    const renderFrame = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.max(300, Math.floor(rect.width));
      const targetH = Math.max(300, Math.floor(rect.height));

      if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
        canvas.width = targetW * dpr;
        canvas.height = targetH * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, targetW, targetH);

      // Subtle architectural blueprint grid
      const gridStep = 44;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < targetW; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx + 0.5, 0);
        ctx.lineTo(gx + 0.5, targetH);
        ctx.stroke();
      }
      for (let gy = 0; gy < targetH; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, gy + 0.5);
        ctx.lineTo(targetW, gy + 0.5);
        ctx.stroke();
      }

      // Draw minor urban city-block micro-grid lines around corridors
      ctx.strokeStyle = 'rgba(59, 73, 75, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        const yPos = (targetH / 6) * i;
        ctx.beginPath();
        ctx.setLineDash([4, 8]);
        ctx.moveTo(20, yPos);
        ctx.lineTo(targetW - 20, yPos);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Map normalized coordinates (0..100) to canvas pixel coordinates
      const toPx = (nx: number, ny: number) => ({
        px: (nx / 100) * targetW,
        py: (ny / 100) * targetH,
      });

      // Draw each traffic corridor vector + flowing vehicle particles
      corridors.forEach((cor, cIdx) => {
        const fromNode = nodes.find((n) => n.id === cor.fromNodeId);
        const toNode = nodes.find((n) => n.id === cor.toNodeId);
        if (!fromNode || !toNode) return;

        const dimCorridor =
          sectorFilter !== 'ALL' &&
          fromNode.sector !== sectorFilter &&
          toNode.sector !== sectorFilter;

        const a = toPx(fromNode.x, fromNode.y);
        const b = toPx(toNode.x, toNode.y);

        let strokeHex = '#00fe66'; // optimal
        if (cor.emergencyGreenWave) {
          strokeHex = '#00f0ff';
        } else if (cor.loadPct >= 80) {
          strokeHex = '#ff2a5f';
        } else if (cor.loadPct >= 62) {
          strokeHex = '#ffb800';
        } else if (cor.aiRerouted) {
          strokeHex = '#00f0ff';
        }

        ctx.save();
        ctx.globalAlpha = dimCorridor ? 0.22 : 1;

        // Outer ambient corridor glow
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.strokeStyle = strokeHex;
        ctx.lineWidth = cor.emergencyGreenWave ? 9 : 6;
        ctx.globalAlpha = dimCorridor ? 0.05 : 0.14;
        ctx.stroke();

        // Sharp inner dual-lane vector
        ctx.globalAlpha = dimCorridor ? 0.28 : 0.85;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.strokeStyle = strokeHex;
        ctx.lineWidth = cor.emergencyGreenWave ? 3 : 2;
        ctx.stroke();

        // Animated traffic flow packets
        const packetCount = Math.max(2, Math.min(6, Math.round(cor.lanes)));
        const speedFactor = (cor.velocityKmh / 60) * 0.0045;
        for (let p = 0; p < packetCount; p++) {
          const tForward = ((phaseTick * speedFactor + p / packetCount + cIdx * 0.17) % 1 + 1) % 1;
          const vx = a.px + (b.px - a.px) * tForward;
          const vy = a.py + (b.py - a.py) * tForward;

          ctx.fillStyle = cor.emergencyGreenWave ? '#dbfcff' : strokeHex;
          ctx.fillRect(vx - 2.5, vy - 2.5, 5, 5);
        }

        // Corridor velocity label at midpoint
        if (showGridLabels && !dimCorridor) {
          const mx = (a.px + b.px) / 2;
          const my = (a.py + b.py) / 2;
          const label = `${cor.velocityKmh} km/h`;
          ctx.font = '500 10px "JetBrains Mono", monospace';
          const textW = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(10, 14, 23, 0.86)';
          ctx.fillRect(mx - textW / 2 - 4, my - 8, textW + 8, 15);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
          ctx.lineWidth = 1;
          ctx.strokeRect(mx - textW / 2 - 4, my - 8, textW + 8, 15);
          ctx.fillStyle = strokeHex;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, mx, my);
        }

        ctx.restore();
      });

      ctx.restore();

      if (isLive) {
        phaseTick += 1;
      }
      animId = window.requestAnimationFrame(renderFrame);
    };

    animId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(animId);
  }, [corridors, isLive, nodes, sectorFilter, showGridLabels]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ry = (e.clientY - rect.top) / Math.max(1, rect.height);
    const lat = (35.712 - ry * 0.045).toFixed(4);
    const lng = (139.662 + rx * 0.068).toFixed(4);
    setCursorCoords({
      lat: `${lat}° N`,
      lng: `${lng}° E`,
    });
  };

  return (
    <div className="hud-glass relative flex flex-col border-t-2 border-t-[#00f0ff] overflow-hidden">
      {/* Map Viewport Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00f0ff]/20 bg-[#0f131c]/90 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-sm font-semibold tracking-wide text-[#dbfcff]">
            Spatial Grid Topology
          </h2>
          <span className="hidden sm:inline-block text-[11px] text-[#00f0ff] tabular-nums">
            {cursorCoords.lat} · {cursorCoords.lng}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sector filter segmented buttons */}
          <div className="flex items-center gap-1 bg-[#0a0e17] p-0.5 border border-[#3b494b]">
            {(
              ['ALL', 'Sector Alpha', 'Core Metro', 'Sector Beta', 'Bayfront'] as const
            ).map((sector) => {
              const active = sectorFilter === sector;
              return (
                <button
                  key={sector}
                  type="button"
                  onClick={() => setSectorFilter(sector)}
                  className={`px-2 py-1 text-[10px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                      : 'text-[#849495] hover:text-[#dfe2ef] border border-transparent'
                  }`}
                >
                  {sector === 'ALL' ? 'All Sectors' : sector}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowGridLabels((v) => !v)}
            className="inline-flex items-center gap-1.5 border border-[#3b494b] bg-[#0a0e17] px-2.5 py-1 text-[10px] font-medium text-[#b9cacb] hover:border-[#00f0ff]/60 hover:text-[#00f0ff] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="h-3 w-3" aria-hidden="true" />
            <span>{showGridLabels ? 'Hide Speeds' : 'Show Speeds'}</span>
          </button>

          {sectorFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSectorFilter('ALL')}
              className="inline-flex items-center gap-1 border border-[#00f0ff]/40 px-2 py-1 text-[10px] text-[#00f0ff] hover:bg-[#00f0ff]/10 cursor-pointer"
              aria-label="Reset sector focus"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Live Feed Viewport */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative h-[430px] sm:h-[490px] w-full bg-[#0a0e17] overflow-hidden select-none"
      >
        {/* Canvas vector simulation layer */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block" />

        {/* Corner HUD crosshairs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-[#00f0ff]/60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-[#00f0ff]/60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-[#00f0ff]/60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-[#00f0ff]/60"
        />

        {/* Interactive Intersection Nodes */}
        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const isDimmed = sectorFilter !== 'ALL' && node.sector !== sectorFilter;
          const meta = getStatusMeta(node.status);

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node.id)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00f0ff] transition-opacity ${
                isDimmed ? 'opacity-30' : 'opacity-100'
              } ${isSelected ? 'z-20' : 'z-10'}`}
              aria-label={`Select intersection ${node.code} ${node.name}, status ${meta.label}`}
            >
              {/* Target Lock Crosshair Ring when selected */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-3 border border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.45)]"
                />
              )}

              {/* Sharp geometric intersection square */}
              <div
                className={`relative flex h-8 w-8 items-center justify-center border-2 transition-transform group-hover:scale-110 ${
                  isSelected
                    ? 'bg-[#00f0ff] text-[#002022] border-[#dbfcff]'
                    : `bg-[#0f131c]/95 ${meta.textClass} ${meta.borderClass}`
                }`}
              >
                <span className="text-[10px] font-bold tracking-tight tabular-nums">
                  {node.code}
                </span>

                {/* Signal phase indicator bar */}
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-1.5 left-0 right-0 h-1 ${
                    node.phase === 'NS_GREEN'
                      ? 'bg-[#00fe66]'
                      : node.phase === 'EW_GREEN'
                      ? 'bg-[#00f0ff]'
                      : 'bg-[#ff2a5f]'
                  }`}
                />
              </div>

              {/* Crisp coordinate & queue label */}
              <div
                className={`mt-2 px-1.5 py-0.5 text-[10px] whitespace-nowrap border backdrop-blur-sm ${
                  isSelected
                    ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#dbfcff]'
                    : 'bg-[#0a0e17]/90 border-[#3b494b] text-[#dfe2ef]'
                }`}
              >
                <span className="font-semibold">{node.name}</span>
                <span className="text-[#849495] mx-1">·</span>
                <span className={`${meta.textClass} tabular-nums`}>
                  Q:{node.queueDepth}
                </span>
              </div>
            </button>
          );
        })}

        {/* Bottom-left Floating Legend & Active Target Summary */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
          <div className="pointer-events-auto hud-glass px-3 py-2 flex flex-wrap items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#00fe66]" />
              <span className="text-[#b9cacb]">Optimal Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#00f0ff]" />
              <span className="text-[#b9cacb]">AI Routing / Priority</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#ffb800]" />
              <span className="text-[#b9cacb]">Elevated Load</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#ff2a5f]" />
              <span className="text-[#b9cacb]">Critical Queue</span>
            </div>
          </div>

          {selectedNode && (
            <div className="hidden sm:flex items-center gap-2 hud-glass px-3 py-2 text-[11px] tabular-nums">
              <Crosshair className="h-3.5 w-3.5 text-[#00f0ff]" aria-hidden="true" />
              <span className="text-[#dbfcff] font-semibold">
                {selectedNode.code} {selectedNode.name}
              </span>
              <span className="text-[#849495]">/</span>
              <span className="text-[#00f0ff]">
                {getPhaseLabel(selectedNode.phase)} ({selectedNode.phaseRemainingSec}s)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
