export type RiskBand = "low" | "watch" | "high" | "critical";

export type CaseStatus = "draft" | "active" | "review" | "retired";

export type CaseFields = {
  title: string;
  system: string;
  context: string;
  autonomy: number;
  reversibility: number;
  oversight: number;
  affected: number;
  voice: number;
  safeguards: string;
  owner: string;
};

export type CaseDraft = CaseFields & {
  status?: CaseStatus;
};

export type RiskFactor = {
  key: "autonomy" | "irreversibility" | "oversight" | "impact" | "voice";
  label: string;
  value: number;
  weight: number;
  contribution: number;
  tone: "signal" | "caution" | "risk";
  rationale: string;
};

export type ScoreResult = {
  score: number;
  band: RiskBand;
  factors: RiskFactor[];
  recommendations: string[];
  summary: string;
};

export type Seal = {
  algorithm: "SHA-384";
  digest: string;
  previousSeal: string;
  sealedAt: string;
};

export type CaseRevision = {
  id: string;
  actor: string;
  action: "created" | "updated" | "retired";
  at: string;
  seal: string;
};

export type CaseRecord = CaseFields & {
  id: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
  score: ScoreResult;
  seal: Seal;
  history: CaseRevision[];
};

export type FeedItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  url: string;
  tags: string[];
  isLive: boolean;
};

export type FeedResponse = {
  items: FeedItem[];
  fetchedAt: string;
  live: boolean;
  sources: Array<{ name: string; live: boolean }>;
};

export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};
