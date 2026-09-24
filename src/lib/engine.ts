import type { CaseDraft, CaseFields, CaseStatus, RiskBand, RiskFactor, ScoreResult } from "./types";

export const DEFAULT_CASE: CaseFields = {
  title: "Untitled stewardship case",
  system: "New agent",
  context: "Describe the people, authority, and environment this system touches.",
  autonomy: 40,
  reversibility: 60,
  oversight: 60,
  affected: 40,
  voice: 50,
  safeguards: "Independent review, least privilege, and a human stop button.",
  owner: "Public steward",
};

export const CASE_STATUSES: CaseStatus[] = ["draft", "active", "review", "retired"];

function clamp(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function text(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

export function normalizeStatus(value: unknown): CaseStatus {
  return CASE_STATUSES.includes(value as CaseStatus) ? (value as CaseStatus) : "draft";
}

export function normalizeCase(input: Partial<CaseDraft> | null | undefined): CaseFields {
  const source = input ?? {};
  return {
    title: text(source.title, DEFAULT_CASE.title, 140),
    system: text(source.system, DEFAULT_CASE.system, 140),
    context: text(source.context, DEFAULT_CASE.context, 1200),
    autonomy: clamp(source.autonomy, DEFAULT_CASE.autonomy),
    reversibility: clamp(source.reversibility, DEFAULT_CASE.reversibility),
    oversight: clamp(source.oversight, DEFAULT_CASE.oversight),
    affected: clamp(source.affected, DEFAULT_CASE.affected),
    voice: clamp(source.voice, DEFAULT_CASE.voice),
    safeguards: text(source.safeguards, DEFAULT_CASE.safeguards, 1200),
    owner: text(source.owner, DEFAULT_CASE.owner, 120),
  };
}

function bandForScore(score: number): RiskBand {
  if (score >= 75) {
    return "critical";
  }
  if (score >= 55) {
    return "high";
  }
  if (score >= 35) {
    return "watch";
  }
  return "low";
}

function factorTone(value: number, cautionAt: number, riskAt: number): RiskFactor["tone"] {
  if (value >= riskAt) {
    return "risk";
  }
  if (value >= cautionAt) {
    return "caution";
  }
  return "signal";
}

export function evaluateCase(input: CaseFields): ScoreResult {
  const current = normalizeCase(input);
  const factors: RiskFactor[] = [
    {
      key: "autonomy",
      label: "Autonomy exposure",
      value: current.autonomy,
      weight: 0.28,
      contribution: current.autonomy * 0.28,
      tone: factorTone(current.autonomy, 60, 80),
      rationale: "How much authority the system can exercise without a human choosing each step.",
    },
    {
      key: "irreversibility",
      label: "Irreversibility",
      value: 100 - current.reversibility,
      weight: 0.18,
      contribution: (100 - current.reversibility) * 0.18,
      tone: factorTone(100 - current.reversibility, 50, 75),
      rationale: "How difficult it is to undo a wrong action, data change, or missed opportunity.",
    },
    {
      key: "oversight",
      label: "Oversight gap",
      value: 100 - current.oversight,
      weight: 0.22,
      contribution: (100 - current.oversight) * 0.22,
      tone: factorTone(100 - current.oversight, 45, 70),
      rationale: "The distance between an accountable human and the agent's consequential actions.",
    },
    {
      key: "impact",
      label: "Impact radius",
      value: current.affected,
      weight: 0.2,
      contribution: current.affected * 0.2,
      tone: factorTone(current.affected, 55, 78),
      rationale: "How many people, institutions, or irreversible interests can be affected.",
    },
    {
      key: "voice",
      label: "Voice gap",
      value: 100 - current.voice,
      weight: 0.12,
      contribution: (100 - current.voice) * 0.12,
      tone: factorTone(100 - current.voice, 50, 75),
      rationale: "How little affected people can contest, redirect, or exit the system.",
    },
  ];

  const score = Math.round(factors.reduce((total, factor) => total + factor.contribution, 0));
  const band = bandForScore(score);
  const recommendations: string[] = [];

  if (current.oversight < 65) {
    recommendations.push("Put an independent human reviewer between the agent and consequential actions.");
  }
  if (current.reversibility < 65) {
    recommendations.push("Publish a rollback path, decision log, and a tested pause switch before launch.");
  }
  if (current.voice < 65) {
    recommendations.push("Give affected people a clear notice, appeal, and opt-out channel.");
  }
  if (current.autonomy > 70) {
    recommendations.push("Constrain tools and credentials with least privilege and a sandboxed evaluation environment.");
  }
  if (current.affected > 70) {
    recommendations.push("Run harm-focused red-team scenarios and define a red line for unacceptable outcomes.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Keep the current controls, name an accountable steward, and re-score after material changes.");
  }

  return {
    score,
    band,
    factors,
    recommendations,
    summary: `${score}/100 control-risk signal. ${band === "low" ? "The case is comparatively contained." : band === "watch" ? "Keep the safeguards visible and test them under pressure." : band === "high" ? "Tighten oversight and reversibility before wider deployment." : "Pause, escalate, and treat this as a red-line scenario until controls change."}`,
  };
}

export function validateDraft(input: unknown): CaseDraft {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("A case object is required.");
  }

  const candidate = input as Record<string, unknown>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  if (title.length < 3) {
    throw new Error("Title must be at least 3 characters.");
  }
  if (title.length > 140) {
    throw new Error("Title must be 140 characters or fewer.");
  }

  return {
    title,
    system: typeof candidate.system === "string" ? candidate.system : DEFAULT_CASE.system,
    context: typeof candidate.context === "string" ? candidate.context : DEFAULT_CASE.context,
    autonomy: clamp(candidate.autonomy, DEFAULT_CASE.autonomy),
    reversibility: clamp(candidate.reversibility, DEFAULT_CASE.reversibility),
    oversight: clamp(candidate.oversight, DEFAULT_CASE.oversight),
    affected: clamp(candidate.affected, DEFAULT_CASE.affected),
    voice: clamp(candidate.voice, DEFAULT_CASE.voice),
    safeguards: typeof candidate.safeguards === "string" ? candidate.safeguards : DEFAULT_CASE.safeguards,
    owner: typeof candidate.owner === "string" ? candidate.owner : DEFAULT_CASE.owner,
    status: normalizeStatus(candidate.status),
  };
}
