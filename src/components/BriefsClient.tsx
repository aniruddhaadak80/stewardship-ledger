"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BriefRecord, ResearchSource } from "@/lib/types";

type BriefPayload = { briefs: BriefRecord[]; count: number; storage: string };
type ResearchPayload = { sources: ResearchSource[] };

export function BriefsClient() {
  const [briefs, setBriefs] = useState<BriefRecord[]>([]);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [title, setTitle] = useState("Alignment evidence brief");
  const [question, setQuestion] = useState("What should an agent builder verify before giving a long-running system more autonomy?");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([fetch("/api/briefs", { cache: "no-store" }), fetch("/api/research", { cache: "no-store" })])
      .then(async ([briefResponse, researchResponse]) => {
        if (!briefResponse.ok || !researchResponse.ok) throw new Error("The saved brief library could not be loaded.");
        return { briefs: (await briefResponse.json()) as BriefPayload, research: (await researchResponse.json()) as ResearchPayload };
      })
      .then((result) => {
        if (!active) return;
        setBriefs(result.briefs.briefs);
        setSources(result.research.sources);
      })
      .catch((error: unknown) => {
        if (active) setNotice(error instanceof Error ? error.message : "The saved brief library could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedLabel = useMemo(() => selectedIds.length ? `${selectedIds.length} source${selectedIds.length === 1 ? "" : "s"} selected` : "All available sources", [selectedIds.length]);

  function toggleSource(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function createBrief() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/briefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, question, sourceIds: selectedIds }) });
      const result = (await response.json()) as { brief?: BriefRecord; error?: string };
      if (!response.ok || !result.brief) throw new Error(result.error ?? "The brief could not be created.");
      setBriefs((current) => [result.brief as BriefRecord, ...current]);
      setNotice("Brief saved with a SHA-384 seal.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The brief could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function archiveBrief(id: string) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/briefs/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { brief?: BriefRecord; error?: string };
      if (!response.ok || !result.brief) throw new Error(result.error ?? "The brief could not be archived.");
      setBriefs((current) => current.filter((brief) => brief.id !== id));
      setNotice("Brief archived; its seal and record remain retained in the database.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The brief could not be archived.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="atlas-page">
      <div className="atlas-shell atlas-detail">
        <div className="atlas-detail__head">
          <div><span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>Saved evidence briefs</span><h1>Keep the question. Keep the trail.</h1></div>
          <p className="atlas-detail__intro">A brief is a durable synthesis, not a verdict. It stores its source IDs, coverage, confidence, action steps, and seal so a teammate can inspect how the answer was formed.</p>
        </div>
        <div className="atlas-detail__grid">
          <section className="atlas-detail__panel">
            <span className="atlas-detail__label">New brief</span>
            <div className="atlas-form">
              <label><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label><span>Question</span><textarea rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
              <div><span className="atlas-detail__label" style={{ marginBottom: 8 }}>Source selection · {selectedLabel}</span><div className="atlas-source-picker">{sources.slice(0, 18).map((source) => <label key={source.id} className={selectedIds.includes(source.id) ? "is-selected" : ""}><input type="checkbox" checked={selectedIds.includes(source.id)} onChange={() => toggleSource(source.id)} /><span>{source.title}</span></label>)}</div></div>
              <div className="atlas-detail__actions"><button className="atlas-button" type="button" onClick={() => void createBrief()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />} Save sealed brief</button><Link className="atlas-button atlas-button--ghost" href="/atlas">Browse atlas <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
            </div>
          </section>
          <aside className="atlas-detail__panel atlas-detail__panel--dark"><span className="atlas-detail__label" style={{ color: "#d7f36b" }}>How to read a brief</span><h2>Scores guide attention.</h2><p>Evidence score reflects the selected records’ grades. Coverage tells you which alignment themes are missing. Confidence is intentionally conservative: a strong score never replaces a human review.</p><div className="atlas-detail__meta" style={{ marginTop: 22 }}><span><ShieldCheck size={14} aria-hidden="true" /> provenance</span><span><FileText size={14} aria-hidden="true" /> plain language</span></div></aside>
        </div>
        {notice && <div className="atlas-notice" style={{ marginTop: 16 }} role="status"><RefreshCw size={15} aria-hidden="true" /> {notice}</div>}
        <div className="atlas-section-heading"><div><span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>Brief library</span><h2>Every synthesis has a handle.</h2></div><p>Open a brief to inspect its source records, revise its question, or verify the seal chain before sharing it.</p></div>
        {loading ? <div className="atlas-loading"><LoaderCircle className="spin" size={20} aria-hidden="true" /> Loading saved briefs…</div> : briefs.length ? <div className="atlas-brief-list">{briefs.map((brief) => <article className="atlas-brief-card" key={brief.id}><div><div className="atlas-brief__meta" style={{ color: "#1b8f7c" }}><span>{brief.confidence} confidence</span><span>{brief.evidenceScore}/100 evidence</span><span>{brief.coverage}% coverage</span></div><h2>{brief.title}</h2><p>{brief.summary}</p><small className="atlas-brief-card__meta">{new Date(brief.updatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })} · {brief.sourceIds.length} sources · v{brief.version}</small></div><div className="atlas-brief-card__actions"><Link className="atlas-button" href={`/briefs/${brief.id}`}>Open <ArrowUpRight size={14} aria-hidden="true" /></Link><button className="icon-button" type="button" onClick={() => void archiveBrief(brief.id)} disabled={busy} aria-label={`Archive ${brief.title}`} title="Archive brief"><Trash2 size={16} aria-hidden="true" /></button></div></article>)}</div> : <div className="atlas-empty"><FileText size={23} aria-hidden="true" /><h2>No saved briefs yet.</h2><p>Choose a question above, select the sources you trust, and save the first evidence trail.</p></div>}
      </div>
    </div>
  );
}
