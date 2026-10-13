export type JevStageId =
  | 'jev-screens'
  | 'sonnet-reads'
  | 'sonnet-patches'
  | 'tests-check'
  | 'person-decides';

export interface JevStageData {
  id: JevStageId;
  index: number;
  timeStart: number;
  timeEnd: number;
  label: string; // e.g. "JEV SCREENS"
  dividerLeft: string; // e.g. "jev > screen issues --handoff sonnet-5.5"
  dividerRight: string; // e.g. "AUTHOR-REPORTED RUN"
  targetNodeId: string;
  hudCard?: {
    title: string;
    line1: string;
    line2: string;
    meterLevel: number; // 0..10
  };
  callouts: {
    text: string;
    subtext?: string;
    xRatio: number;
    yRatio: number;
  }[];
  codeSnippet: string[];
}

export interface SatelliteNode {
  id: string;
  xRatio: number; // 0..1
  yRatio: number;
  radius: number;
  spinesCount: number;
  spinesLength: number;
  coreColor: string;
  label: string;
  sublabel: string;
  state: 'idle' | 'scanning' | 'passed' | 'rejected' | 'merged';
}
