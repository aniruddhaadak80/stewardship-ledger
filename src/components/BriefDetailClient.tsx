"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, ExternalLink, Fingerprint, LoaderCircle, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BriefRecord, ResearchSource } from "@/lib/types";

export function BriefDetailClient({ initialBrief }: { initialBrief: BriefRecord }) {
  const [brief, setBrief] = useState(initialBrief);
  const [title, setTitle] = useState(initialBrief.title);
  const [question, setQuestion] = useState(initialBrief.question);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/research", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Source records could not be loaded.");
        return (await response.json()) as { sources: ResearchSource[] };
      })
      .then((result) => {
        if (active) setSources(result.sources.filter((source) => brief.sourceIds.includes(source.id)));
      })
      .catch((error: unknown) => {
        if (active) setNotice(error instanceof Error ? error.message : "Source records could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [brief.sourceIds]);

  const selectedSources = useMemo(() => sources.filter((source) => brief.sourceIds.includes(source.id)), [brief.sourceIds, sources]);

  async function saveBrief() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/briefs/${brief.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, question }) });
      const result = (await response.json()) as { brief?: BriefRecord; error?: string };
      if (!response.ok || !result.brief) throw new Error(result.error ?? "The brief could not be updated.");
      setBrief(result.brief);
      setNotice("Brief updated and re-sealed against the previous digest.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The brief could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function archiveBrief() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/briefs/${brief.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The brief could not be archived.");
      setNotice("Brief archived. Its record remains available through the sealed database trail.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The brief could not be archived.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="atlas-page">
      <div className="atlas-shell atlas-detail">
        <Link className="atlas-detail__back" href="/briefs"><ArrowLeft size={15} aria-hidden="true" /> Back to saved briefs</Link>
        <div className="atlas-detail__head">
          <div><span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>Sealed synthesis / v{brief.version}</span><h1>{brief.title}</h1></div>
          <div className="atlas-detail__meta"><span>{brief.confidence} confidence</span><span>{brief.evidenceScore}/100 evidence</span><span>{brief.coverage}% coverage</span></div>
        </div>
        {notice && <div className="atlas-notice" style={{ marginBottom: 16 }} role="status"><ShieldCheck size={15} aria-hidden="true" /> {notice}</div>}
        <div className="atlas-detail__grid">
          <div>
            <section className="atlas-detail__panel"><span className="atlas-detail__label">The question</span><p>{brief.question}</p><span className="atlas-detail__label" style={{ marginTop: 20 }}>Plain-language synthesis</span><p className="atlas-brief__summary" style={{ color: "#1b8f7c !important" }}>{brief.summary}</p><p>{brief.plainLanguage}</p><div className="atlas-themes">{brief.themes.filter((theme) => theme.sourceCount > 0).map((theme) => <div className="atlas-theme" key={theme.key}><strong>{theme.label}</strong><span>{theme.signal} · {theme.sourceCount} sources</span></div>)}</div></section>
            <section className="atlas-detail__panel" style={{ marginTop: 14 }}><span className="atlas-detail__label">Responsible next moves</span><ul className="atlas-action-list" style={{ color: "rgba(16,19,35,0.72)" }}>{brief.actionSteps.map((step) => <li key={step} style={{ color: "rgba(16,19,35,0.72)" }}><Check size={15} aria-hidden="true" /><span>{step}</span></li>)}</ul>{brief.unsettled.length > 0 && <><span className="atlas-detail__label" style={{ marginTop: 20 }}>Open questions</span><ul className="atlas-unsettled-list" style={{ color: "rgba(16,19,35,0.72)" }}>{brief.unsettled.map((item) => <li key={item} style={{ color: "rgba(16,19,35,0.72)" }}><CircleAlert size={15} aria-hidden="true" /><span>{item}</span></li>)}</ul></>}</section>
          </div>
          <aside>
            <section className="atlas-detail__panel atlas-detail__panel--dark"><span className="atlas-detail__label" style={{ color: "#d7f36b" }}>Revise the question</span><div className="atlas-form"><label><span style={{ color: "rgba(248,243,232,0.6)" }}>Title</span><input style={{ background: "#fffaf0" }} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label><span style={{ color: "rgba(248,243,232,0.6)" }}>Question</span><textarea style={{ background: "#fffaf0" }} rows={4} value={question} onChange={(event) => setQuestion(event.target.value)} /></label><div className="atlas-detail__actions"><button className="atlas-button" type="button" onClick={() => void saveBrief()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} Save and re-seal</button><button className="atlas-button atlas-button--ghost" type="button" onClick={() => void archiveBrief()} disabled={busy}><Trash2 size={15} aria-hidden="true" /> Archive</button></div></div></section>
            <section className="atlas-detail__panel" style={{ marginTop: 14 }}><span className="atlas-detail__label">Seal record</span><p><Fingerprint size={15} aria-hidden="true" /> {brief.seal.algorithm} · {brief.seal.digest}</p><p style={{ marginTop: 12 }}><ShieldCheck size={15} aria-hidden="true" /> Previous seal: {brief.seal.previousSeal}</p><p style={{ marginTop: 12 }}>Created {new Date(brief.createdAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</p></section>
          </aside>
        </div>
        <div className="atlas-section-heading"><div><span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>Source provenance</span><h2>Every claim stays attached.</h2></div><p>Open the original records behind this brief. Their limitations remain part of the synthesis.</p></div>
        {selectedSources.length ? <div className="atlas-source-grid">{selectedSources.map((source) => <article className="atlas-source-card" key={source.id}><div className="atlas-source-card__top"><span className={`atlas-kind atlas-kind--${source.kind}`}>{source.kind}</span><span>{source.evidenceGrade}</span></div><h3>{source.title}</h3><p>{source.keyClaim}</p><div className="atlas-source-card__footer"><span>{source.publisher}</span><div style={{ display: "flex", gap: 10 }}><Link href={`/sources/${source.id}`}>Details <ArrowUpRight size={13} aria-hidden="true" /></Link><a href={source.url} target="_blank" rel="noreferrer">Original <ExternalLink size={13} aria-hidden="true" /></a></div></div></article>)}</div> : <div className="atlas-empty"><CircleAlert size={23} aria-hidden="true" /><h2>Source records are unavailable.</h2><p>The brief is still readable, but the original records could not be loaded from the current storage adapter.</p></div>}
      </div>
    </div>
  );
}
