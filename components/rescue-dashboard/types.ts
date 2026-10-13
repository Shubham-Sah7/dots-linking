export type StageId =
  | 'source-audit'
  | 'install'
  | 'playback'
  | 'export-review'
  | 'audio-repair'
  | 'old-projects'
  | 'clean-machine'
  | 'approved';

export interface AgentInfo {
  id: string;
  name: string;
  label: string; // e.g. "agent / installer"
  action: string; // e.g. "rebuilding installer"
  xRatio: number; // 0..1
  yRatio: number; // 0..1
  status: 'tracing' | 'relaying' | 'linked' | 'joining' | 'verified';
  signalLevel: number; // 1..4
  taskMetrics: {
    read: number; // 0..100
    verify: number; // 0..100
    share: number; // 0..100
    retain: number; // 0..100
  };
}

export interface StreamCallout {
  text: string;
  from: string; // agent id
  to: string; // agent id
  xRatio?: number;
  yRatio?: number;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

export interface LogEntry {
  prefix: string; // e.g. "dep:", "inst:", "rev:", "aud:", "all:"
  text: string;
  isActive?: boolean;
  type?: 'normal' | 'active' | 'warning' | 'success';
}

export interface ContextLedger {
  context: number;
  evidence: number;
  memory: number;
  tools: number;
  messages: number;
  results: number;
}

export interface PayloadInspectorData {
  sender: string;
  target: string;
  artifact: string;
  audio: string;
  review: string;
  patch: string;
}

export interface StageData {
  id: StageId;
  index: number;
  timeStart: number;
  timeEnd: number;
  topBadge: string;
  pillLabel: string;
  middleBannerLeft: string;
  middleBannerRight: string;
  isApprovedBadge?: boolean;
  agentSubtitles: Record<string, string>;
  activeAgents: string[];
  callouts: StreamCallout[];
  runLogs: LogEntry[];
  codeLines: { num: string; code: string; isHighlighted?: boolean }[];
  evidenceTree: { text: string; status: string; indent: number; isHighlighted?: boolean }[];
  contextLedger: ContextLedger;
  payload: PayloadInspectorData;
  signalPatternSeed: number;
}
