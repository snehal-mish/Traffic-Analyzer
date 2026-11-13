import { useState } from 'react';
import { TopCommandBar } from './components/TopCommandBar';
import { TacticalMapCanvas } from './components/TacticalMapCanvas';
import { NodeInspectorPanel } from './components/NodeInspectorPanel';
import { TerminalEventLog } from './components/TerminalEventLog';
import { CorridorAnalyticsScreen } from './components/CorridorAnalyticsScreen';
import { FleetDispatchScreen } from './components/FleetDispatchScreen';
import { PolicyControlsScreen } from './components/PolicyControlsScreen';
import { useTrafficSimulation } from './hooks/useTrafficSimulation';
import { ScreenId } from './types/traffic';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('command-map');

  const {
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
  } = useTrafficSimulation();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  const handleInspectFromAnalytics = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setActiveScreen('command-map');
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-[#dfe2ef] flex flex-col">
      <TopCommandBar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        isLive={isLive}
        onToggleLive={() => setIsLive((prev) => !prev)}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-6">
        {activeScreen === 'command-map' && (
          <div className="space-y-4">
            {/* Screen 1 Header + Primary KPI Strip */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-wider text-[#00f0ff]">
                  Metropolitan Sector Grid · {policy.autonomyMode.replace('_', ' ')} ·{' '}
                  {isLive ? 'LIVE TELEMETRY' : 'FEED PAUSED'}
                </p>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#dbfcff]">
                  Urban Traffic AI Command
                </h1>
              </div>

              {/* Scenario quick status */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#849495]">Scenario:</span>
                <button
                  type="button"
                  onClick={() => setActiveScreen('policy-controls')}
                  className="border border-[#00f0ff]/40 bg-[#131b2e]/85 px-3 py-1.5 text-xs font-medium text-[#00f0ff] hover:bg-[#00f0ff]/10 cursor-pointer"
                >
                  {activeScenario.replace('_', ' ')}
                </button>
              </div>
            </div>

            {/* 4-Column Crisp Telemetry KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 tabular-nums">
              <div className="hud-glass border-t-2 border-t-[#00f0ff] px-4 py-3">
                <div className="text-[11px] text-[#849495] tracking-wider">
                  Grid Throughput
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-bold text-[#dbfcff]">
                    {metrics.totalThroughput.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#00f0ff]">veh/hr</span>
                </div>
              </div>

              <div className="hud-glass border-t-2 border-t-[#00fe66] px-4 py-3">
                <div className="text-[11px] text-[#849495] tracking-wider">
                  Mean Corridor Velocity
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-bold text-[#ebffe6]">
                    {metrics.avgVelocity}
                  </span>
                  <span className="text-xs text-[#00fe66]">km/h avg</span>
                </div>
              </div>

              <div className="hud-glass border-t-2 border-t-[#d6baff] px-4 py-3">
                <div className="text-[11px] text-[#849495] tracking-wider">
                  AI Signal Sync Confidence
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-2xl font-bold text-[#fcf3ff]">
                    {metrics.syncEfficiency}%
                  </span>
                  <span className="text-xs text-[#d6baff]">8 nodes</span>
                </div>
              </div>

              <div
                className={`hud-glass border-t-2 px-4 py-3 ${
                  metrics.criticalNodes > 0 || metrics.activeOverrides > 0
                    ? 'border-t-[#ff2a5f]'
                    : 'border-t-[#00fe66]'
                }`}
              >
                <div className="text-[11px] text-[#849495] tracking-wider">
                  Manual Overrides / Critical
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className={`font-display text-2xl font-bold ${
                      metrics.criticalNodes > 0 ? 'text-[#ff2a5f]' : 'text-[#00fe66]'
                    }`}
                  >
                    {metrics.activeOverrides} / {metrics.criticalNodes}
                  </span>
                  <span className="text-xs text-[#ffb800]">active</span>
                </div>
              </div>
            </div>

            {/* Primary 12-Column Command Grid: Spatial Map (8) + Inspector (4) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
              <div className="xl:col-span-8">
                <TacticalMapCanvas
                  nodes={nodes}
                  corridors={corridors}
                  selectedNodeId={selectedNode.id}
                  onSelectNode={setSelectedNodeId}
                  isLive={isLive}
                />
              </div>

              <div className="xl:col-span-4">
                <NodeInspectorPanel
                  node={selectedNode}
                  onOverridePhase={overrideNodePhase}
                  onUpdateThreshold={updateNodeThreshold}
                  onRerouteCorridors={rerouteNodeCorridors}
                />
              </div>
            </div>

            {/* Bottom Event Terminal Log */}
            <TerminalEventLog logs={logs} />
          </div>
        )}

        {activeScreen === 'corridor-analytics' && (
          <CorridorAnalyticsScreen
            nodes={nodes}
            corridors={corridors}
            onUpdateNodeCycle={updateNodeCycle}
            onSelectNodeAndJump={handleInspectFromAnalytics}
          />
        )}

        {activeScreen === 'fleet-dispatch' && (
          <FleetDispatchScreen
            fleet={fleet}
            selectedFleetId={selectedFleetId}
            onSelectFleet={setSelectedFleetId}
            onDispatchPriority={dispatchPriorityCorridor}
            isLive={isLive}
          />
        )}

        {activeScreen === 'policy-controls' && (
          <PolicyControlsScreen
            policy={policy}
            activeScenario={activeScenario}
            onUpdatePolicy={updatePolicy}
            onTriggerScenario={triggerScenario}
          />
        )}
      </main>
    </div>
  );
}
