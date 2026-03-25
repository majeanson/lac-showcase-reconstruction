// Feature type derived from feat-2026-002 (React App Shell) + feat-2026-019 (Priority)
// feat-2026-028 (Filter) + feat-2026-029 (Card Enhancements)

export interface Decision {
  decision: string;
  rationale: string;
  alternativesConsidered?: string[];
  date?: string;
}

export interface Lineage {
  parent?: string;
  children?: string[];
  spawnReason?: string;
}

export interface Annotation {
  id: string;
  author: string;
  date: string;
  type: string;
  body: string;
}

export interface StatusHistoryEntry {
  from: string;
  to: string;
  date: string;
  reason?: string;
}

export interface Revision {
  date: string;
  author: string;
  fields_changed: string[];
  reason: string;
}

export interface Feature {
  featureKey: string;
  title: string;
  status: 'draft' | 'active' | 'frozen' | 'deprecated';
  problem: string;
  schemaVersion?: number;
  analysis?: string;
  implementation?: string;
  decisions?: Decision[];
  tags?: string[];
  lineage?: Lineage;
  successCriteria?: string;
  domain?: string;
  priority?: number;
  knownLimitations?: string[];
  annotations?: Annotation[];
  statusHistory?: StatusHistoryEntry[];
  revisions?: Revision[];
}

// FeatureNode extends Feature with tree-traversal data
export interface FeatureNode extends Feature {
  depth: number;
  descendantCount: number;
}
