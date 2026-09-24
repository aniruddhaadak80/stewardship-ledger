import type { AlignmentBrief, BriefTheme, ResearchSource } from "./types";

const THEME_DEFINITIONS = [
  { key: "oversight", label: "Oversight & monitoring", terms: ["oversight", "monitoring", "human-agency", "governance", "accountability"] },
  { key: "control", label: "Control & containment", terms: ["control", "loss-of-control", "security", "constraints", "access-control", "permissions"] },
  { key: "evals", label: "Evaluations & evidence", terms: ["evals", "benchmarks", "evidence", "verification", "measurement", "overclaiming"] },
  { key: "interpretability", label: "Interpretability & diagnosis", terms: ["interpretability", "deception", "training", "pretraining", "measurement"] },
  { key: "agents", label: "Agentic systems", terms: ["agents", "multi-agent", "autonomous-rd", "long-horizon", "tools", "mcp"] },
  { key: "care", label: "Care, voice & agency", terms: ["care", "voice", "human-agency", "co-production", "accountability"] },
] as const;

const GRADE_WEIGHT: Record<ResearchSource["evidenceGrade"], number> = {
  primary: 1,
  experimental: 0.9,
  synthesis: 0.75,
  "first-party": 0.7,
  commentary: 0.45,
};

function sourceMatchesTheme(source: ResearchSource, terms: readonly string[]): boolean {
  const haystack = `${source.title} ${source.summary} ${source.keyClaim} ${source.topics.join(" ")}`.toLowerCase();
  return source.topics.some((topic) => terms.includes(topic.toLowerCase())) || terms.some((term) => haystack.includes(term));
}

function signalFor(sources: ResearchSource[]): BriefTheme["signal"] {
  if (sources.length >= 3 && sources.some((source) => source.evidenceGrade === "primary" || source.evidenceGrade === "experimental")) {
    return "grounded";
  }
  if (sources.length > 0) {
    return "developing";
  }
  return "open";
}

function themeTakeaway(label: string, sources: ResearchSource[]): string {
  if (sources.length === 0) {
    return `No source in this selection directly covers ${label.toLowerCase()}; treat it as an evidence gap.`;
  }
  const strongest = [...sources].sort((left, right) => GRADE_WEIGHT[right.evidenceGrade] - GRADE_WEIGHT[left.evidenceGrade])[0];
  return `${sources.length} source${sources.length === 1 ? "" : "s"} touch ${label.toLowerCase()}; the strongest evidence grade here is ${strongest.evidenceGrade}.`;
}

export function buildAlignmentBrief(sources: ResearchSource[], question = "What should an agent builder understand before deploying a high-autonomy system?", title = "Alignment evidence brief"): AlignmentBrief {
  const unique = [...new Map(sources.map((source) => [source.id, source])).values()].sort((left, right) => left.id.localeCompare(right.id));
  const themes: BriefTheme[] = THEME_DEFINITIONS.map((definition) => {
    const matching = unique.filter((source) => sourceMatchesTheme(source, definition.terms));
    return {
      key: definition.key,
      label: definition.label,
      sourceIds: matching.map((source) => source.id),
      sourceCount: matching.length,
      signal: signalFor(matching),
      takeaway: themeTakeaway(definition.label, matching),
    };
  });
  const covered = themes.filter((theme) => theme.sourceCount > 0).length;
  const evidenceScore = unique.length === 0 ? 0 : Math.round((unique.reduce((total, source) => total + GRADE_WEIGHT[source.evidenceGrade], 0) / unique.length) * 100);
  const strongCount = unique.filter((source) => source.evidenceGrade === "primary" || source.evidenceGrade === "experimental").length;
  const confidence: AlignmentBrief["confidence"] = strongCount >= 3 && covered >= 4 ? "high" : strongCount >= 1 || unique.length >= 4 ? "medium" : "low";
  const topThemes = [...themes].filter((theme) => theme.sourceCount > 0).sort((left, right) => right.sourceCount - left.sourceCount).slice(0, 2);
  const summary = unique.length === 0
    ? "This selection has no sources yet. Add research before treating the brief as evidence."
    : `Across ${unique.length} selected source${unique.length === 1 ? "" : "s"}, the strongest recurring themes are ${topThemes.map((theme) => theme.label.toLowerCase()).join(" and ") || "still unclassified"}.`;
  const plainLanguage = unique.length === 0
    ? "There is not enough evidence here to make a responsible claim. Start with a primary paper, a report, or a clearly attributed practitioner source."
    : `Read this as a map, not a verdict: ${topThemes[0]?.takeaway ?? "No dominant theme is present."} The next step is to turn the strongest theme into a testable control and replay it against an incident-derived scenario.`;
  const unsettled = themes.filter((theme) => theme.sourceCount === 0).map((theme) => `Coverage gap: ${theme.label}.`);
  const limitations = unique.filter((source) => source.limitations).slice(0, 2).map((source) => `${source.title}: ${source.limitations}`);
  const actionSteps = [
    themes.some((theme) => theme.key === "oversight" && theme.sourceCount > 0) ? "Instrument monitor coverage, review latency, and escalation rate before adding more autonomy." : "Add an independent reviewer with explicit stop and escalation authority.",
    themes.some((theme) => theme.key === "control" && theme.sourceCount > 0) ? "Replay a legitimate task with degraded constraints and an executable unsafe opportunity." : "Test whether authorization boundaries survive context compaction and long tool chains.",
    themes.some((theme) => theme.key === "evals" && theme.sourceCount > 0) ? "Turn one incident or commentary claim into a deterministic trajectory check." : "Add an evaluation that checks the trajectory and state change, not only the final answer.",
    "Name an accountable human and an affected-person route to contest, pause, or revise the decision.",
  ];
  return {
    title: title.trim() || "Alignment evidence brief",
    question: question.trim() || "What should an agent builder understand before deploying a high-autonomy system?",
    summary,
    plainLanguage,
    unsettled: [...unsettled, ...limitations].slice(0, 6),
    actionSteps,
    themes,
    sourceIds: unique.map((source) => source.id),
    coverage: Math.round((covered / THEME_DEFINITIONS.length) * 100),
    confidence,
    evidenceScore,
  };
}
