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
  previousSeal: string;
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

export type SourceKind = "paper" | "report" | "podcast" | "commentary" | "tool";

export type EvidenceGrade = "primary" | "synthesis" | "first-party" | "experimental" | "commentary";

export type SourceStance = "constructive" | "cautionary" | "mixed" | "skeptical" | "optimistic";

export type ResearchSource = {
  id: string;
  kind: SourceKind;
  title: string;
  publisher: string;
  authors: string;
  publishedAt: string;
  url: string;
  summary: string;
  keyClaim: string;
  limitations: string;
  topics: string[];
  evidenceGrade: EvidenceGrade;
  stance: SourceStance;
  isLive: boolean;
  fetchedAt: string | null;
  sourceHash: string;
};

export type CommentaryLens = {
  id: string;
  sourceId: string;
  author: string;
  role: string;
  stance: SourceStance;
  body: string;
  counterpoint: string;
  url: string;
  publishedAt: string;
};

export type ResearchFeedResponse = {
  sources: ResearchSource[];
  commentary: CommentaryLens[];
  fetchedAt: string;
  live: boolean;
  providers: Array<{ name: string; live: boolean }>;
};

export type BriefTheme = {
  key: string;
  label: string;
  sourceIds: string[];
  sourceCount: number;
  signal: "grounded" | "developing" | "open";
  takeaway: string;
};

export type AlignmentBrief = {
  title: string;
  question: string;
  summary: string;
  plainLanguage: string;
  unsettled: string[];
  actionSteps: string[];
  themes: BriefTheme[];
  sourceIds: string[];
  coverage: number;
  confidence: "high" | "medium" | "low";
  evidenceScore: number;
};

export type BriefRecord = AlignmentBrief & {
  id: string;
  caseId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
  seal: Seal;
};
