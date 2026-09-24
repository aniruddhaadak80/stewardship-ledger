import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical";
import { evaluateCase } from "./engine";
import type { CaseFields, CaseRecord, FeedItem, ScoreResult, Seal } from "./types";

export const GENESIS_SEAL = "0".repeat(96);

export function createSeal(input: CaseFields, score: ScoreResult, previousSeal: string, sealedAt = new Date().toISOString()): Seal {
  const digestInput = `${previousSeal}${canonicalJson({ input, score })}`;
  return {
    algorithm: "SHA-384",
    digest: `${createHashHex(digestInput)}`,
    previousSeal,
    sealedAt,
  };
}

function createHashHex(value: string): string {
  return createHash("sha384").update(value).digest("hex");
}

export function verifySeal(record: CaseRecord): boolean {
  const fields: CaseFields = {
    title: record.title,
    system: record.system,
    context: record.context,
    autonomy: record.autonomy,
    reversibility: record.reversibility,
    oversight: record.oversight,
    affected: record.affected,
    voice: record.voice,
    safeguards: record.safeguards,
    owner: record.owner,
  };
  const expected = createSeal(fields, record.score, record.seal.previousSeal, record.seal.sealedAt);
  return expected.digest === record.seal.digest;
}

export function verifySealChain(records: CaseRecord[]): {
  valid: boolean;
  checked: number;
  brokenAt: string | null;
  head: string;
} {
  const ordered = [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  let previous = GENESIS_SEAL;

  for (const record of ordered) {
    if (record.seal.previousSeal !== previous || !verifySeal(record)) {
      return { valid: false, checked: ordered.indexOf(record) + 1, brokenAt: record.id, head: previous };
    }
    previous = record.seal.digest;
  }

  return { valid: true, checked: ordered.length, brokenAt: null, head: previous };
}

export function buildSeedRecord(input: CaseFields, id: string, createdAt: string, previousSeal: string, status: CaseRecord["status"] = "active"): CaseRecord {
  const score = evaluateCase(input);
  const seal = createSeal(input, score, previousSeal, createdAt);
  return {
    ...input,
    id,
    status,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    version: 1,
    score,
    seal,
    history: [{ id: `${id}-v1`, actor: "seed", action: "created", at: createdAt, seal: seal.digest }],
  };
}

export const FALLBACK_CASES: CaseRecord[] = (() => {
  const seeds: Array<{ id: string; input: CaseFields; createdAt: string; status: CaseRecord["status"] }> = [
    {
      id: "care-circle-companion",
      createdAt: "2026-09-20T10:00:00.000Z",
      status: "active",
      input: {
        title: "Care-circle companion",
        system: "Elder-care planning copilot",
        context: "A local assistant helps residents and carers compare support options, never diagnosing or closing a case.",
        autonomy: 28,
        reversibility: 82,
        oversight: 78,
        affected: 62,
        voice: 76,
        safeguards: "Plain-language explanations, resident consent, carer override, and a visible stop button.",
        owner: "Civic care lab",
      },
    },
    {
      id: "claims-adjuster",
      createdAt: "2026-09-21T12:00:00.000Z",
      status: "review",
      input: {
        title: "Autonomous claims adjuster",
        system: "Insurance claims agent",
        context: "An agent recommends claim outcomes across a large portfolio and can request sensitive evidence.",
        autonomy: 76,
        reversibility: 34,
        oversight: 43,
        affected: 78,
        voice: 38,
        safeguards: "Second-line review exists on paper, but appeal paths and model-error monitoring are incomplete.",
        owner: "Public assurance team",
      },
    },
    {
      id: "research-shell-agent",
      createdAt: "2026-09-22T15:00:00.000Z",
      status: "active",
      input: {
        title: "Research agent with shell",
        system: "Code research runner",
        context: "A developer agent can inspect repositories, run tests, and open pull requests in an isolated environment.",
        autonomy: 64,
        reversibility: 74,
        oversight: 69,
        affected: 28,
        voice: 54,
        safeguards: "Ephemeral containers, network allowlists, human merge approval, and replayable tool logs.",
        owner: "Open tooling guild",
      },
    },
    {
      id: "municipal-benefits",
      createdAt: "2026-09-23T09:30:00.000Z",
      status: "draft",
      input: {
        title: "Municipal benefits navigator",
        system: "Public-service eligibility agent",
        context: "A resident-facing agent helps people discover possible benefits and routes complex cases to caseworkers.",
        autonomy: 42,
        reversibility: 88,
        oversight: 73,
        affected: 84,
        voice: 82,
        safeguards: "No final eligibility decisions, translated explanations, appeal handoff, and weekly fairness review.",
        owner: "Digital rights clinic",
      },
    },
  ];

  let previous = GENESIS_SEAL;
  return seeds.map(({ id, input, createdAt, status }) => {
    const record = buildSeedRecord(input, id, createdAt, previous, status);
    previous = record.seal.digest;
    return record;
  });
})();

export const FALLBACK_FEED: FeedItem[] = [
  {
    id: "fallback-singapore-consensus",
    title: "The 2026 Singapore Consensus on Global AI Safety Research Priorities",
    summary: "A global research agenda highlights agentic risk management, evaluation awareness, and oversight that remains challengeable.",
    publishedAt: "2026-09-01T00:00:00.000Z",
    source: "AI Safety Priorities",
    url: "https://aisafetypriorities.org/",
    tags: ["agentic risk", "oversight", "research priorities"],
    isLive: false,
  },
  {
    id: "fallback-embedded-assessments",
    title: "Embedded Assessments for Frontier AI",
    summary: "New work argues for continuous, independent assessment of internal agent monitoring, permissions, and alignment.",
    publishedAt: "2026-09-21T00:00:00.000Z",
    source: "arXiv",
    url: "https://arxiv.org/abs/2609.25413",
    tags: ["evaluation", "monitoring", "frontier AI"],
    isLive: false,
  },
  {
    id: "fallback-safety-not-optional",
    title: "AI Safety: Not Optional, Not Later",
    summary: "A safety-by-design assurance architecture separates predictive supervision from outcome-seeking agency.",
    publishedAt: "2026-09-09T00:00:00.000Z",
    source: "arXiv",
    url: "https://arxiv.org/pdf/2609.10630v1.pdf",
    tags: ["assurance", "control", "agents"],
    isLive: false,
  },
  {
    id: "fallback-care-ai",
    title: "Attentiveness in Long-Term Care AI",
    summary: "A care-centered account starts with dignity, choice, human relationships, and the people affected by a system.",
    publishedAt: "2026-03-13T00:00:00.000Z",
    source: "Civic AI",
    url: "https://civic.ai/care-ai/",
    tags: ["care ethics", "voice", "co-production"],
    isLive: false,
  },
  {
    id: "fallback-responsible-ai",
    title: "Responsible AI | The 2026 AI Index Report",
    summary: "Stanford HAI tracks rising incident counts, uneven safety reporting, and the practical limits of responsible-AI programs.",
    publishedAt: "2026-01-01T00:00:00.000Z",
    source: "Stanford HAI",
    url: "https://hai.stanford.edu/ai-index/2026-ai-index-report/responsible-ai",
    tags: ["evidence", "accountability", "incidents"],
    isLive: false,
  },
  {
    id: "fallback-z-inspection",
    title: "Z-Inspection in early healthcare AI design",
    summary: "A co-design case turns ethical dilemmas and risks into concrete requirements before deployment.",
    publishedAt: "2026-09-14T00:00:00.000Z",
    source: "AI and Ethics",
    url: "https://link.springer.com/article/10.1007/s43681-026-01337-3",
    tags: ["co-design", "requirements", "healthcare"],
    isLive: false,
  },
];
