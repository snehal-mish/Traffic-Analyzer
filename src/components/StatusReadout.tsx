import { NodeStatus, SignalPhase } from '../types/traffic';

export function getStatusMeta(status: NodeStatus): {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  hex: string;
} {
  switch (status) {
    case 'OPTIMAL':
      return {
        label: 'OPTIMAL',
        textClass: 'text-[#00fe66]',
        bgClass: 'bg-[#00fe66]/15',
        borderClass: 'border-[#00fe66]/40',
        hex: '#00fe66',
      };
    case 'ACTIVE_AI':
      return {
        label: 'AI ROUTED',
        textClass: 'text-[#00f0ff]',
        bgClass: 'bg-[#00f0ff]/15',
        borderClass: 'border-[#00f0ff]/40',
        hex: '#00f0ff',
      };
    case 'ELEVATED':
      return {
        label: 'ELEVATED',
        textClass: 'text-[#ffb800]',
        bgClass: 'bg-[#ffb800]/15',
        borderClass: 'border-[#ffb800]/40',
        hex: '#ffb800',
      };
    case 'CRITICAL':
      return {
        label: 'CRITICAL',
        textClass: 'text-[#ff2a5f]',
        bgClass: 'bg-[#ff2a5f]/15',
        borderClass: 'border-[#ff2a5f]/45',
        hex: '#ff2a5f',
      };
  }
}

export function getPhaseLabel(phase: SignalPhase): string {
  switch (phase) {
    case 'NS_GREEN':
      return 'N/S GREEN';
    case 'EW_GREEN':
      return 'E/W GREEN';
    case 'ALL_RED':
      return 'ALL-RED HOLD';
  }
}
