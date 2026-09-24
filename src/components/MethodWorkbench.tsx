"use client";

import { ArrowRight, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { CaseDraft, ScoreResult } from "@/lib/types";

const initial: CaseDraft = {
  title: "Neighborhood benefits navigator",
  system: "Public-service eligibility agent",
  context: "A resident-facing agent helps people discover possible support and routes complex cases to a human caseworker.",
  autonomy: 42,
  reversibility: 88,
  oversight: 73,
  affected: 84,
  voice: 82,
  safeguards: "No final eligibility decisions, translated explanations, appeal handoff, and weekly fairness review.",
  owner: "Digital rights clinic",
};

export function MethodWorkbench() {
  const [draft, setDraft] = useState(initial);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(key: keyof CaseDraft, value: string | number) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function runScore() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ case: draft }) });
      const payload = (await response.json()) as { score?: ScoreResult; error?: string };
      if (!response.ok || !payload.score) {
        throw new Error(payload.error ?? "The score could not be calculated.");
      }
      setResult(payload.score);
    } catch (scoreError) {
      setError(scoreError instanceof Error ? scoreError.message : "The score could not be calculated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="method-workbench">
      <div className="method-workbench__copy">
        <span className="eyebrow">A tiny protocol</span>
        <h2>Start with the person, not the benchmark.</h2>
        <p>Move the two controls that matter most: how much authority the system has, and how much power affected people can exercise. Then run the same explainable engine used by the public ledger.</p>
        <label className="range-field"><span className="range-field__top"><strong>Autonomy</strong><b>{draft.autonomy}</b></span><input type="range" min="0" max="100" value={draft.autonomy} onChange={(event) => update("autonomy", Number(event.target.value))} /><span className="range-field__ends"><small>suggests</small><small>acts alone</small></span></label>
        <label className="range-field" style={{ marginTop: 18 }}><span className="range-field__top"><strong>Affected voice</strong><b>{draft.voice}</b></span><input type="range" min="0" max="100" value={draft.voice} onChange={(event) => update("voice", Number(event.target.value))} /><span className="range-field__ends"><small>no route back</small><small>consent + appeal</small></span></label>
        <div className="form-actions"><button className="button-primary" type="button" onClick={() => void runScore()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />} {busy ? "Reading…" : "Run the sample"}</button><button className="button-secondary" type="button" onClick={() => { setDraft(initial); setResult(null); setError(""); }}><RotateCcw size={15} aria-hidden="true" /> Reset</button></div>
        {error && <div className="chain-result chain-result--invalid">{error}</div>}
      </div>
      <div className="method-workbench__result">
        {result ? <><div className="workbench-score"><strong>{result.score}</strong><span>/100 control-risk signal</span></div><div className="workbench-factors">{result.factors.map((factor) => <div className="workbench-factor" key={factor.key}><span>{factor.label}</span><strong>+{factor.contribution.toFixed(1)}</strong></div>)}</div><p style={{ marginTop: 20 }}>{result.summary}</p></> : <div className="agent-response__empty"><ArrowRight size={21} aria-hidden="true" /><span>Your factor breakdown will appear here.</span></div>}
      </div>
    </section>
  );
}
