"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, ExternalLink, FileText, LoaderCircle, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { BriefRecord, CommentaryLens, ResearchSource } from "@/lib/types";

export function SourceDetailClient({ source, commentary }: { source: ResearchSource; commentary: CommentaryLens[] }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [briefId, setBriefId] = useState("");

  async function buildBrief() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceIds: [source.id],
          question: `What does this source establish about ${source.topics[0] ?? "alignment"}, and what should we verify next?`,
          title: `Brief: ${source.title}`,
        }),
      });
      const result = (await response.json()) as { brief?: BriefRecord; error?: string };
      if (!response.ok || !result.brief) throw new Error(result.error ?? "The brief could not be created.");
      setBriefId(result.brief.id);
      setNotice("A sealed brief was saved from this source.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The brief could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="atlas-page">
      <div className="atlas-shell atlas-detail">
        <Link className="atlas-detail__back" href="/atlas"><ArrowLeft size={15} aria-hidden="true" /> Back to the evidence atlas</Link>
        <div className="atlas-detail__head">
          <div>
            <span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>{source.kind} / {source.evidenceGrade}</span>
            <h1>{source.title}</h1>
          </div>
          <div className="atlas-detail__meta"><span>{source.publisher}</span><span>{new Date(source.publishedAt).toLocaleDateString("en", { dateStyle: "medium" })}</span><span>{source.isLive ? "live provider" : "sealed fallback"}</span></div>
        </div>
        <div className="atlas-detail__grid">
          <div>
            <section className="atlas-detail__panel"><span className="atlas-detail__label">In plain language</span><p>{source.summary}</p><span className="atlas-detail__label" style={{ marginTop: 19 }}>What it claims</span><p>{source.keyClaim}</p><span className="atlas-detail__label" style={{ marginTop: 19 }}>What it cannot establish alone</span><p>{source.limitations}</p><div className="atlas-topics" style={{ marginTop: 20 }}>{source.topics.map((topic) => <span className="atlas-topic" key={topic}>{topic}</span>)}</div></section>
            {commentary.length > 0 && <section className="atlas-detail__panel" style={{ marginTop: 14 }}><span className="atlas-detail__label">Attributed commentary</span>{commentary.map((item) => <div className="atlas-commentary-card" key={item.id} style={{ marginTop: 10 }}><div className="atlas-commentary-card__author"><span>{item.author}</span><span>{item.stance}</span></div><p>{item.body}</p><small><strong>Counterpoint:</strong> {item.counterpoint}</small></div>)}</section>}
          </div>
          <aside className="atlas-detail__panel atlas-detail__panel--dark">
            <span className="atlas-detail__label" style={{ color: "#d7f36b" }}>Turn this record into a brief</span>
            <h2>Keep the question attached to the evidence.</h2>
            <p>Select this source in a plain-language synthesis. The result stores the source IDs, coverage gaps, action steps, and a SHA-384 seal.</p>
            <div className="atlas-detail__actions"><button className="atlas-button" type="button" onClick={() => void buildBrief()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <WandSparkles size={16} aria-hidden="true" />} Build a sealed brief</button></div>
            {notice && <div className="atlas-notice" style={{ marginTop: 16 }} role="status"><Sparkles size={15} aria-hidden="true" /> {notice}</div>}
            {briefId && <div className="atlas-detail__actions"><Link className="atlas-button atlas-button--ghost" href={`/briefs/${briefId}`}>Open saved brief <ArrowUpRight size={15} aria-hidden="true" /></Link></div>}
          </aside>
        </div>
        <div className="atlas-detail__grid" style={{ marginTop: 14 }}>
          <section className="atlas-detail__panel"><span className="atlas-detail__label">Provenance</span><p><FileText size={15} aria-hidden="true" /> {source.authors || "Authors were not included in the public record."}</p><p style={{ marginTop: 12 }}><ShieldCheck size={15} aria-hidden="true" /> Source fingerprint: <code>{source.sourceHash || "not yet persisted"}</code></p><p style={{ marginTop: 12 }}><Check size={15} aria-hidden="true" /> Fetch status: {source.fetchedAt ? new Date(source.fetchedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" }) : "curated record"}</p></section>
          <section className="atlas-detail__panel"><span className="atlas-detail__label">Open the original</span><p>Follow the publisher record for the full method, data, transcript, or tool documentation.</p><div className="atlas-detail__actions"><a className="atlas-button" href={source.url} target="_blank" rel="noreferrer">Open publisher record <ExternalLink size={15} aria-hidden="true" /></a></div></section>
        </div>
        <div className="atlas-unsettled-list" style={{ marginTop: 18 }}><CircleAlert size={16} aria-hidden="true" /><span>Read the original before relying on this summary. The atlas preserves uncertainty instead of filling it with a confident sentence.</span></div>
      </div>
    </div>
  );
}
