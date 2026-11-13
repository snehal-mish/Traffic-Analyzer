import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, Radio } from 'lucide-react';
import { FleetUnit, FleetUnitType } from '../types/traffic';

interface FleetDispatchScreenProps {
  fleet: FleetUnit[];
  selectedFleetId: string;
  onSelectFleet: (id: string) => void;
  onDispatchPriority: (id: string) => void;
  isLive: boolean;
}

export function FleetDispatchScreen({
  fleet,
  selectedFleetId,
  onSelectFleet,
  onDispatchPriority,
  isLive,
}: FleetDispatchScreenProps) {
  const [typeFilter, setTypeFilter] = useState<'ALL' | FleetUnitType>('ALL');
  const sensorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedUnit = fleet.find((u) => u.id === selectedFleetId) ?? fleet[0];

  const filteredFleet = useMemo(() => {
    if (typeFilter === 'ALL') return fleet;
    return fleet.filter((u) => u.type === typeFilter);
  }, [fleet, typeFilter]);

  // Live LiDAR Corridor Sensor Viewport simulation
  useEffect(() => {
    const canvas = sensorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const draw = () => {
      const w = 520;
      const h = 250;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, w, h);

      // Perspective corridor lane lines
      const horizonY = 54;
      const centerX = w / 2;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;

      [-180, -90, 0, 90, 180].forEach((offset, idx) => {
        ctx.beginPath();
        ctx.moveTo(centerX + offset * 0.16, horizonY);
        ctx.lineTo(centerX + offset * 1.3, h);
        ctx.setLineDash(idx === 2 ? [8, 8] : []);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Distance radar arcs
      [1, 2, 3].forEach((ring) => {
        const yRing = horizonY + ring * 52;
        ctx.strokeStyle = 'rgba(0, 254, 102, 0.14)';
        ctx.beginPath();
        ctx.moveTo(40, yRing);
        ctx.lineTo(w - 40, yRing);
        ctx.stroke();
      });

      // Moving LiDAR scan bar
      const scanY = horizonY + ((tick * 1.8) % (h - horizonY));
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      // Simulated forward vehicle bounding boxes
      const leadShift = Math.sin(tick * 0.04) * 8;
      const box1X = centerX - 38;
      const box1Y = 104 + leadShift * 0.4;
      const boxColor =
        selectedUnit.status === 'PRIORITY_CORRIDOR' ? '#00f0ff' : '#00fe66';

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(box1X, box1Y, 76, 44);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fillRect(box1X, box1Y, 76, 44);

      ctx.fillStyle = boxColor;
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(
        `LEAD HDWY ${selectedUnit.headwayMeters}m`,
        box1X,
        box1Y - 6
      );

      // Adjacent lane tracked entity
      const adjX = centerX + 86;
      const adjY = 148 - leadShift * 0.6;
      ctx.strokeStyle = '#ffb800';
      ctx.strokeRect(adjX, adjY, 64, 38);
      ctx.fillStyle = '#ffb800';
      ctx.fillText('ADJ +12.4m', adjX, adjY - 6);

      // Ego vector triangle at bottom center
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, h - 34);
      ctx.lineTo(centerX - 18, h - 10);
      ctx.lineTo(centerX + 18, h - 10);
      ctx.closePath();
      ctx.stroke();

      if (isLive) tick += 1;
      animId = window.requestAnimationFrame(draw);
    };

    animId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(animId);
  }, [isLive, selectedUnit]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#00f0ff]/20 pb-4">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-[#00f0ff]">
            Autonomous Transit & Emergency Operations
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#dbfcff]">
            Autonomous Fleet & Corridor Dispatch
          </h1>
        </div>

        {/* Unit Type Segmented Filter */}
        <div className="flex items-center gap-1 bg-[#0a0e17] p-0.5 border border-[#3b494b]">
          {(['ALL', 'EMERGENCY', 'TRANSIT', 'FREIGHT', 'DRONE'] as const).map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  typeFilter === type
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                    : 'text-[#849495] hover:text-[#dfe2ef] border border-transparent'
                }`}
              >
                {type}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Fleet Roster Table (7 cols) */}
        <section className="lg:col-span-7 hud-glass border-t-2 border-t-[#00f0ff]">
          <div className="flex items-center justify-between border-b border-[#00f0ff]/20 px-4 py-3 bg-[#0f131c]/80">
            <h2 className="font-display text-base font-semibold text-[#dbfcff]">
              Active Autonomous Units
            </h2>
            <span className="text-xs text-[#849495] tabular-nums">
              {filteredFleet.length} units tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs tabular-nums">
              <thead>
                <tr className="border-b border-[#3b494b]/60 bg-[#0a0e17]/80 text-[10px] uppercase tracking-wider text-[#849495]">
                  <th className="py-2.5 px-4 font-medium">Callsign</th>
                  <th className="py-2.5 px-4 font-medium">Class</th>
                  <th className="py-2.5 px-4 font-medium">Corridor</th>
                  <th className="py-2.5 px-4 font-medium">State</th>
                  <th className="py-2.5 px-4 font-medium text-right">Speed</th>
                  <th className="py-2.5 px-4 font-medium text-right">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b494b]/40">
                {filteredFleet.map((unit) => {
                  const selected = unit.id === selectedUnit.id;
                  const stateStyle =
                    unit.status === 'PRIORITY_CORRIDOR'
                      ? 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/50'
                      : unit.status === 'HOLDING'
                      ? 'bg-[#ffb800]/15 text-[#ffb800] border-[#ffb800]/50'
                      : 'bg-[#00fe66]/15 text-[#00fe66] border-[#00fe66]/40';

                  return (
                    <tr
                      key={unit.id}
                      onClick={() => onSelectFleet(unit.id)}
                      className={`cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#00f0ff]/12'
                          : 'hover:bg-[#1c1f29]/70'
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-[#dbfcff] whitespace-nowrap">
                        {unit.callsign}
                      </td>
                      <td className="py-3 px-4 text-[#b9cacb] whitespace-nowrap">
                        {unit.type}
                      </td>
                      <td className="py-3 px-4 text-[#dfe2ef] whitespace-nowrap">
                        {unit.corridorName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block border px-1.5 py-0.5 text-[10px] font-semibold ${stateStyle}`}
                        >
                          {unit.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#dfe2ef]">
                        {unit.speedKmh} km/h
                      </td>
                      <td className="py-3 px-4 text-right text-[#00f0ff]">
                        {unit.etaMinutes} min
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Selected Unit LiDAR Viewport & Dispatch Control (5 cols) */}
        <aside className="lg:col-span-5 hud-glass border-t-2 border-t-[#00fe66] hud-glow-cyan">
          <div className="flex items-start justify-between gap-3 border-b border-[#00f0ff]/20 px-4 py-3 bg-[#0f131c]/90">
            <div>
              <div className="text-[11px] text-[#849495]">
                {selectedUnit.type} · {selectedUnit.corridorName}
              </div>
              <h2 className="mt-0.5 font-display text-lg font-bold text-[#dbfcff]">
                {selectedUnit.callsign}
              </h2>
            </div>

            <span className="border border-[#00fe66]/45 bg-[#00fe66]/15 px-2 py-1 text-[10px] font-semibold text-[#00fe66] tabular-nums">
              BAT {selectedUnit.batteryPct}%
            </span>
          </div>

          {/* Live LiDAR Sensor Viewport */}
          <div className="relative border-b border-[#00f0ff]/20 bg-[#0a0e17]">
            <canvas
              ref={sensorCanvasRef}
              className="w-full h-[220px] block object-cover"
            />
            <div className="pointer-events-none absolute top-2.5 left-3 flex items-center gap-2 text-[10px] text-[#00f0ff]">
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              <span>FORWARD LIDAR · CORRIDOR LOCK</span>
            </div>
            <div className="pointer-events-none absolute bottom-2.5 right-3 text-[10px] text-[#dfe2ef] tabular-nums bg-[#0a0e17]/80 px-2 py-0.5 border border-[#3b494b]">
              VEL {selectedUnit.speedKmh} km/h · HDWY {selectedUnit.headwayMeters}m
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="border border-[#3b494b]/70 bg-[#0a0e17] p-3">
                <div className="text-[10px] text-[#849495]">Payload / Manifest</div>
                <div className="mt-1 font-medium text-[#dfe2ef]">
                  {selectedUnit.passengersOrPayload}
                </div>
              </div>
              <div className="border border-[#3b494b]/70 bg-[#0a0e17] p-3">
                <div className="text-[10px] text-[#849495]">Destination ETA</div>
                <div className="mt-1 font-bold text-[#00f0ff]">
                  {selectedUnit.etaMinutes} min
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDispatchPriority(selectedUnit.id)}
              disabled={selectedUnit.status === 'PRIORITY_CORRIDOR'}
              className={`hud-chamfer-sm inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                selectedUnit.status === 'PRIORITY_CORRIDOR'
                  ? 'bg-[#00fe66]/20 text-[#00fe66] border border-[#00fe66]/50 cursor-default'
                  : 'bg-[#00f0ff] text-[#002022] border border-[#7df4ff] shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:bg-[#7df4ff]'
              }`}
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              <span>
                {selectedUnit.status === 'PRIORITY_CORRIDOR'
                  ? 'Green-Wave Priority Active'
                  : 'Dispatch Green-Wave Corridor'}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
