export type ScreenId =
  | 'command-map'
  | 'corridor-analytics'
  | 'fleet-dispatch'
  | 'policy-controls';

export type NodeStatus = 'OPTIMAL' | 'ACTIVE_AI' | 'ELEVATED' | 'CRITICAL';

export type SignalPhase = 'NS_GREEN' | 'EW_GREEN' | 'ALL_RED';

export type LogSeverity = 'INFO' | 'WARNING' | 'OVERRIDE';

export type AutonomyMode = 'AUTONOMOUS' | 'SUPERVISED' | 'MANUAL_HOLD';

export type FleetUnitType = 'TRANSIT' | 'EMERGENCY' | 'FREIGHT' | 'DRONE';

export type FleetUnitStatus = 'EN_ROUTE' | 'PRIORITY_CORRIDOR' | 'HOLDING' | 'CHARGING';

export type ScenarioId =
  | 'NOMINAL'
  | 'RUSH_SURGE'
  | 'TUNNEL_BOTTLENECK'
  | 'EMERGENCY_CONVOY';

export interface IntersectionNode {
  id: string;
  code: string;
  name: string;
  sector: string;
  x: number; // normalized 0..100 on spatial map
  y: number; // normalized 0..100 on spatial map
  lat: number;
  lng: number;
  phase: SignalPhase;
  phaseRemainingSec: number;
  cycleLengthSec: number;
  queueDepth: number; // vehicles waiting
  throughputVph: number; // vehicles per hour
  avgSpeedKmh: number;
  pedestrianCount: number;
  aiConfidence: number; // 0..100
  interventionThreshold: number; // 40..95
  manualOverride: boolean;
  status: NodeStatus;
}

export interface TrafficCorridor {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lanes: number;
  loadPct: number; // 0..100
  velocityKmh: number;
  aiRerouted: boolean;
  emergencyGreenWave: boolean;
}

export interface FleetUnit {
  id: string;
  callsign: string;
  type: FleetUnitType;
  corridorId: string;
  corridorName: string;
  speedKmh: number;
  headwayMeters: number;
  batteryPct: number;
  passengersOrPayload: string;
  status: FleetUnitStatus;
  etaMinutes: number;
}

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  sector: string;
  severity: LogSeverity;
  message: string;
}

export interface HourlyFluxPoint {
  hourLabel: string;
  observedFlow: number;
  aiPredictedFlow: number;
  avgSpeedKmh: number;
}

export interface GridPolicyState {
  autonomyMode: AutonomyMode;
  dynamicGreenWave: boolean;
  emergencyPreemption: boolean;
  pedestrianSafetyBuffer: boolean;
  ecoSpeedHarmonization: boolean;
  rerouteSensitivity: number; // 10..100
  maxQueueTolerance: number; // 10..60 vehicles
  cycleAdaptationRate: number; // 1..10
}
