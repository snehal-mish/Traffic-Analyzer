import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_CORRIDORS,
  INITIAL_FLEET,
  INITIAL_LOGS,
  INITIAL_NODES,
  INITIAL_POLICY,
} from '../data/initialGrid';
import {
  FleetUnit,
  GridPolicyState,
  IntersectionNode,
  LogSeverity,
  NodeStatus,
  ScenarioId,
  SignalPhase,
  TerminalLogEntry,
  TrafficCorridor,
} from '../types/traffic';

function formatNowTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function deriveNodeStatus(queueDepth: number, manualOverride: boolean): NodeStatus {
  if (queueDepth >= 40) return 'CRITICAL';
  if (queueDepth >= 28) return 'ELEVATED';
  if (manualOverride || queueDepth >= 18) return 'ACTIVE_AI';
  return 'OPTIMAL';
}

export function useTrafficSimulation() {
  const [nodes, setNodes] = useState<IntersectionNode[]>(INITIAL_NODES);
  const [corridors, setCorridors] = useState<TrafficCorridor[]>(INITIAL_CORRIDORS);
  const [fleet, setFleet] = useState<FleetUnit[]>(INITIAL_FLEET);
  const [logs, setLogs] = useState<TerminalLogEntry[]>(INITIAL_LOGS);
  const [policy, setPolicy] = useState<GridPolicyState>(INITIAL_POLICY);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('NOMINAL');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('sec-07');
  const [selectedFleetId, setSelectedFleetId] = useState<string>('flt-01');

  const appendLog = useCallback(
    (sector: string, severity: LogSeverity, message: string) => {
      const entry: TerminalLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatNowTime(),
        sector,
        severity,
        message,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 60));
    },
    []
  );

  // Simulation tick every 1000ms when live
  useEffect(() => {
    if (!isLive) return;
    const timer = window.setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          let nextRemaining = node.phaseRemainingSec - 1;
          let nextPhase = node.phase;

          if (nextRemaining <= 0) {
            if (node.manualOverride) {
              nextRemaining = Math.max(10, Math.round(node.cycleLengthSec / 2));
            } else {
              nextPhase =
                node.phase === 'NS_GREEN'
                  ? 'EW_GREEN'
                  : node.phase === 'EW_GREEN'
                  ? 'NS_GREEN'
                  : 'NS_GREEN';
              nextRemaining = Math.round(node.cycleLengthSec / 2);
            }
          }

          // Gentle organic flux based on phase & policy
          const deltaSeed = Math.sin(Date.now() / 1700 + node.x) * 2;
          const aiRelief =
            policy.autonomyMode === 'AUTONOMOUS' && policy.dynamicGreenWave ? -0.45 : 0.15;
          const rawQueue = Math.max(
            4,
            Math.min(62, Math.round(node.queueDepth + deltaSeed * 0.45 + aiRelief))
          );

          const speedAdjust = Math.max(
            14,
            Math.min(68, Number((64 - rawQueue * 0.78 + deltaSeed * 0.5).toFixed(1)))
          );

          const throughputAdjust = Math.max(
            950,
            Math.round(node.throughputVph + deltaSeed * 18)
          );

          return {
            ...node,
            phase: nextPhase,
            phaseRemainingSec: nextRemaining,
            queueDepth: rawQueue,
            avgSpeedKmh: speedAdjust,
            throughputVph: throughputAdjust,
            status: deriveNodeStatus(rawQueue, node.manualOverride),
          };
        })
      );

      setCorridors((prev) =>
        prev.map((cor, idx) => {
          const wave = Math.cos(Date.now() / 2200 + idx) * 2.2;
          const loadDelta = cor.emergencyGreenWave ? -1.4 : cor.aiRerouted ? -0.6 : wave * 0.5;
          const nextLoad = Math.max(18, Math.min(96, Math.round(cor.loadPct + loadDelta)));
          const nextVel = Math.max(
            18,
            Math.min(72, Math.round(70 - nextLoad * 0.52 + (cor.emergencyGreenWave ? 12 : 0)))
          );
          return {
            ...cor,
            loadPct: nextLoad,
            velocityKmh: nextVel,
          };
        })
      );

      setFleet((prev) =>
        prev.map((unit, idx) => {
          const jitter = Math.sin(Date.now() / 1900 + idx) * 1.4;
          const targetSpeed =
            unit.status === 'PRIORITY_CORRIDOR'
              ? Math.max(62, Math.min(82, unit.speedKmh + jitter))
              : unit.status === 'HOLDING'
              ? Math.max(12, Math.min(28, unit.speedKmh + jitter))
              : Math.max(30, Math.min(75, unit.speedKmh + jitter));
          return {
            ...unit,
            speedKmh: Number(targetSpeed.toFixed(1)),
            headwayMeters: Number(
              Math.max(8.5, Math.min(98, unit.headwayMeters + jitter * 0.4)).toFixed(1)
            ),
            etaMinutes: Number(
              Math.max(0.8, unit.etaMinutes - 0.015 + (jitter > 1 ? 0.02 : 0)).toFixed(1)
            ),
          };
        })
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLive, policy.autonomyMode, policy.dynamicGreenWave]);

  const overrideNodePhase = useCallback(
    (nodeId: string, targetPhase: SignalPhase | 'AUTO') => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== nodeId) return node;
          if (targetPhase === 'AUTO') {
            appendLog(
              node.code,
              'INFO',
              `${node.name} returned to AI autonomous signal scheduling.`
            );
            return {
              ...node,
              manualOverride: false,
              phase: 'NS_GREEN',
              phaseRemainingSec: Math.round(node.cycleLengthSec / 2),
              status: deriveNodeStatus(node.queueDepth, false),
            };
          }
          const phaseLabel =
            targetPhase === 'NS_GREEN'
              ? 'N/S Green Hold'
              : targetPhase === 'EW_GREEN'
              ? 'E/W Green Hold'
              : 'All-Red Safety Hold';
          appendLog(node.code, 'OVERRIDE', `Manual phase lock (${phaseLabel}) applied at ${node.name}.`);
          return {
            ...node,
            phase: targetPhase,
            phaseRemainingSec: 45,
            manualOverride: true,
            status: targetPhase === 'ALL_RED' ? 'CRITICAL' : deriveNodeStatus(node.queueDepth, true),
          };
        })
      );
    },
    [appendLog]
  );

  const updateNodeThreshold = useCallback((nodeId: string, threshold: number) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, interventionThreshold: threshold } : node
      )
    );
  }, []);

  const updateNodeCycle = useCallback(
    (nodeId: string, cycleLengthSec: number) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                cycleLengthSec,
                phaseRemainingSec: Math.min(node.phaseRemainingSec, cycleLengthSec),
              }
            : node
        )
      );
      const target = nodes.find((n) => n.id === nodeId);
      if (target) {
        appendLog(target.code, 'INFO', `Signal cycle updated to ${cycleLengthSec}s at ${target.name}.`);
      }
    },
    [appendLog, nodes]
  );

  const rerouteNodeCorridors = useCallback(
    (nodeId: string) => {
      const target = nodes.find((n) => n.id === nodeId);
      if (!target) return;

      setCorridors((prev) =>
        prev.map((cor) => {
          if (cor.fromNodeId === nodeId || cor.toNodeId === nodeId) {
            return {
              ...cor,
              aiRerouted: true,
              loadPct: Math.max(24, cor.loadPct - 18),
              velocityKmh: Math.min(66, cor.velocityKmh + 12),
            };
          }
          return cor;
        })
      );

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== nodeId) return n;
          const relievedQueue = Math.max(8, n.queueDepth - 15);
          return {
            ...n,
            queueDepth: relievedQueue,
            avgSpeedKmh: Number(Math.min(62, n.avgSpeedKmh + 13.5).toFixed(1)),
            status: deriveNodeStatus(relievedQueue, n.manualOverride),
          };
        })
      );

      appendLog(
        target.code,
        'INFO',
        `AI Corridor Reroute dispatched around ${target.name}; inbound load diverted -18%.`
      );
    },
    [appendLog, nodes]
  );

  const dispatchPriorityCorridor = useCallback(
    (unitId: string) => {
      const unit = fleet.find((f) => f.id === unitId);
      if (!unit) return;

      setFleet((prev) =>
        prev.map((item) =>
          item.id === unitId
            ? {
                ...item,
                status: 'PRIORITY_CORRIDOR',
                speedKmh: Number(Math.max(66, item.speedKmh + 14).toFixed(1)),
                etaMinutes: Number(Math.max(1.1, item.etaMinutes * 0.62).toFixed(1)),
              }
            : item
        )
      );

      setCorridors((prev) =>
        prev.map((cor) =>
          cor.id === unit.corridorId
            ? {
                ...cor,
                emergencyGreenWave: true,
                aiRerouted: true,
                loadPct: Math.max(20, cor.loadPct - 22),
                velocityKmh: Math.min(72, cor.velocityKmh + 16),
              }
            : cor
        )
      );

      appendLog(
        'DISPATCH',
        'OVERRIDE',
        `Green-Wave Priority Corridor activated for ${unit.callsign} on ${unit.corridorName}.`
      );
    },
    [appendLog, fleet]
  );

  const triggerScenario = useCallback(
    (scenario: ScenarioId) => {
      setActiveScenario(scenario);

      if (scenario === 'NOMINAL') {
        setNodes(INITIAL_NODES);
        setCorridors(INITIAL_CORRIDORS);
        setFleet(INITIAL_FLEET);
        appendLog('GRID', 'INFO', 'Nominal traffic flow baseline restored across all 8 sectors.');
        return;
      }

      if (scenario === 'RUSH_SURGE') {
        setNodes((prev) =>
          prev.map((n) => {
            const q = Math.min(58, n.queueDepth + 16);
            return {
              ...n,
              queueDepth: q,
              throughputVph: n.throughputVph + 540,
              avgSpeedKmh: Number(Math.max(16, n.avgSpeedKmh - 12).toFixed(1)),
              pedestrianCount: n.pedestrianCount + 35,
              status: deriveNodeStatus(q, n.manualOverride),
            };
          })
        );
        setCorridors((prev) =>
          prev.map((c) => ({
            ...c,
            loadPct: Math.min(95, c.loadPct + 24),
            velocityKmh: Math.max(19, c.velocityKmh - 14),
          }))
        );
        appendLog(
          'GRID',
          'WARNING',
          'Peak Rush Hour Surge active: commuter volume +32% across Core Metro.'
        );
      }

      if (scenario === 'TUNNEL_BOTTLENECK') {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === 'sec-07' || n.id === 'sec-04') {
              return {
                ...n,
                queueDepth: 54,
                avgSpeedKmh: 16.4,
                manualOverride: true,
                phase: 'ALL_RED',
                status: 'CRITICAL',
              };
            }
            return n;
          })
        );
        setCorridors((prev) =>
          prev.map((c) =>
            c.id === 'cor-8' || c.id === 'cor-9'
              ? { ...c, loadPct: 94, velocityKmh: 18, emergencyGreenWave: false }
              : c
          )
        );
        setSelectedNodeId('sec-07');
        appendLog(
          'N-07',
          'OVERRIDE',
          'Harbor Tunnel Bottleneck simulated: inbound lanes restricted, All-Red safety hold engaged.'
        );
      }

      if (scenario === 'EMERGENCY_CONVOY') {
        setCorridors((prev) =>
          prev.map((c) =>
            c.id === 'cor-4' || c.id === 'cor-9' || c.id === 'cor-10'
              ? { ...c, emergencyGreenWave: true, aiRerouted: true, loadPct: 26, velocityKmh: 68 }
              : c
          )
        );
        setFleet((prev) =>
          prev.map((u) =>
            u.type === 'EMERGENCY'
              ? { ...u, status: 'PRIORITY_CORRIDOR', speedKmh: 74.2 }
              : u
          )
        );
        appendLog(
          'DISPATCH',
          'OVERRIDE',
          'Multi-sector Emergency Convoy Green-Wave locked across Spine -> Bayfront Causeway.'
        );
      }
    },
    [appendLog]
  );

  const updatePolicy = useCallback(
    (patch: Partial<GridPolicyState>, logMsg?: string) => {
      setPolicy((prev) => ({ ...prev, ...patch }));
      if (logMsg) {
        appendLog('POLICY', 'INFO', logMsg);
      }
    },
    [appendLog]
  );

  const metrics = useMemo(() => {
    const totalThroughput = nodes.reduce((acc, n) => acc + n.throughputVph, 0);
    const avgVelocity =
      nodes.reduce((acc, n) => acc + n.avgSpeedKmh, 0) / Math.max(1, nodes.length);
    const avgConfidence =
      nodes.reduce((acc, n) => acc + n.aiConfidence, 0) / Math.max(1, nodes.length);
    const activeOverrides = nodes.filter((n) => n.manualOverride).length;
    const criticalNodes = nodes.filter((n) => n.status === 'CRITICAL').length;

    return {
      totalThroughput,
      avgVelocity: Number(avgVelocity.toFixed(1)),
      syncEfficiency: Number(avgConfidence.toFixed(1)),
      activeOverrides,
      criticalNodes,
    };
  }, [nodes]);

  return {
    nodes,
    corridors,
    fleet,
    logs,
    policy,
    isLive,
    setIsLive,
    activeScenario,
    selectedNodeId,
    setSelectedNodeId,
    selectedFleetId,
    setSelectedFleetId,
    metrics,
    overrideNodePhase,
    updateNodeThreshold,
    updateNodeCycle,
    rerouteNodeCorridors,
    dispatchPriorityCorridor,
    triggerScenario,
    updatePolicy,
  };
}
