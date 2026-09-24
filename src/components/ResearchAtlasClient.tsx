"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AtlasMap } from "@/components/AtlasMap";
import { ResearchSourceCard } from "@/components/ResearchSourceCard";
import type { BriefRecord, CommentaryLens, ResearchSource } from "@/lib/types";

type ResearchPayload = {
  sources: ResearchSource[];
  commentary: CommentaryLens[];
  count: number;
  storage: string;
};

const topicOptions = [
  "alignment",
  "agents",
  "oversight",
  "monitoring",
  "control",
  "evals",
  "interpretability",
  "governance",
  "care",
  "misalignment",
  "security",
];

export function ResearchAtlasClient() {
  const [payload, setPayload] = useState<ResearchPayload | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [topic, setTopic] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [question, setQuestion] = useState(
    "What should an agent builder verify before giving a long-running system more autonomy?",
  );
  const [brief, setBrief] = useState<BriefRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/research", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("The research atlas could not be loaded.");
        return (await response.json()) as ResearchPayload;
      })
      .then((result) => {
        if (active) setPayload(result);
      })
      .catch((error: unknown) => {
        if (active) setNotice(error instanceof Error ? error.message : "The research atlas could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sources = useMemo(() => payload?.sources ?? [], [payload?.sources]);
  const commentary = useMemo(() => payload?.commentary ?? [], [payload?.commentary]);
  const filtered = useMemo(
    () =>
      sources
        .filter((source) => kind === "all" || source.kind === kind)
        .filter((source) => topic === "all" || source.topics.includes(topic))
        .filter((source) => {
          const haystack = `${source.title} ${source.publisher} ${source.summary} ${source.keyClaim} ${source.topics.join(" ")}`.toLowerCase();
          return !query.trim() || haystack.includes(query.trim().toLowerCase());
        }),
    [kind, query, sources, topic],
  );
  const liveCount = sources.filter((source) => source.isLive).length;
  const primaryCount = sources.filter(
    (source) => source.evidenceGrade === "primary" || source.evidenceGrade === "experimental",
  ).length;

  function toggleSource(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function refreshSources() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/research/refresh", { method: "POST" });
      const result = (await response.json()) as { imported?: number; live?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Refresh failed.");
      setNotice(`Refreshed ${result.imported ?? 0} public sources${result.live ? " with live provider data" : " using sealed fallback records"}.`);
      const refreshed = (await fetch("/api/research", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("The refreshed atlas could not be read.");
        return (await response.json()) as ResearchPayload;
      }));
      setPayload(refreshed);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Refresh failed.");
    } finally {
      setBusy(false);
    }
  }

  async function buildBrief() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIds: selectedIds, question, title: "Alignment evidence brief" }),
      });
      const result = (await response.json()) as { brief?: BriefRecord; error?: string };
      if (!response.ok || !result.brief) throw new Error(result.error ?? "The brief could not be created.");
      setBrief(result.brief);
      setNotice("Brief saved with a SHA-384 seal and source provenance.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The brief could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="atlas-page">
      <section className="atlas-hero">
        <div className="atlas-shell">
          <span className="atlas-eyebrow">Alignment evidence atlas / 2026</span>
          <h1>
            Read the evidence.
            <em>Then act.</em>
          </h1>
          <p className="atlas-hero__copy">
            A living index of alignment papers, frontier reports, podcast transcripts, and attributable commentary—translated into plain-language briefs your team can test.
          </p>
          <div className="atlas-hero__actions">
            <button className="atlas-button" type="button" onClick={() => void refreshSources()} disabled={busy}>
              <RefreshCw size={16} aria-hidden="true" /> Refresh public sources
            </button>
            <Link className="atlas-button atlas-button--ghost" href="/briefs">
              Open saved briefs <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="atlas-shell">
          <AtlasMap sources={filtered} />
        </div>
      </section>

      <div className="atlas-shell atlas-body">
        <div className="atlas-toolbar">
          <div className="atlas-filters">
            <label className="atlas-input">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search sources</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, claim, topic" />
            </label>
            <label className="atlas-select">
              <FileSearch size={15} aria-hidden="true" />
              <span className="sr-only">Filter by source type</span>
              <select value={kind} onChange={(event) => setKind(event.target.value)}>
                <option value="all">All source types</option>
                <option value="paper">Papers</option>
                <option value="report">Reports</option>
                <option value="podcast">Podcasts</option>
                <option value="commentary">Commentary</option>
                <option value="tool">Tools</option>
              </select>
            </label>
            <label className="atlas-select">
              <span className="sr-only">Filter by topic</span>
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option value="all">All topics</option>
                {topicOptions.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className="atlas-toolbar__actions">
            <span className="atlas-topic">{selectedIds.length} selected</span>
            <button className="atlas-button" type="button" onClick={() => void buildBrief()} disabled={busy}>
              <WandSparkles size={16} aria-hidden="true" /> Build plain-language brief
            </button>
          </div>
        </div>

        <div className="atlas-stats">
          <div className="atlas-stat"><span>Sources</span><strong>{sources.length}</strong><small>curated + refreshed</small></div>
          <div className="atlas-stat"><span>Live providers</span><strong>{liveCount}</strong><small>arXiv · OpenAlex · RSS</small></div>
          <div className="atlas-stat"><span>Primary evidence</span><strong>{primaryCount}</strong><small>study or experiment</small></div>
          <div className="atlas-stat"><span>Commentary lenses</span><strong>{commentary.length}</strong><small>claims + counterpoints</small></div>
        </div>

        {notice && <div className="atlas-notice" role="status"><Sparkles size={15} aria-hidden="true" /> {notice}</div>}

        <label className="atlas-form atlas-question">
          <span>Brief question</span>
          <textarea rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>

        <div className="atlas-section-heading">
          <div><span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>The source shelf</span><h2>Start with the claim, not the headline.</h2></div>
          <p>Every card shows what the source says, what it cannot establish, and how strong its evidence is. Select records to build a saved brief.</p>
        </div>

        {loading ? (
          <div className="atlas-loading"><LoaderCircle className="spin" size={20} aria-hidden="true" /> Loading the evidence shelf…</div>
        ) : filtered.length ? (
          <div className="atlas-source-grid">
            {filtered.map((source) => <ResearchSourceCard key={source.id} source={source} selected={selectedIds.includes(source.id)} onToggle={toggleSource} />)}
          </div>
        ) : (
          <div className="atlas-empty"><FileSearch size={23} aria-hidden="true" /><h2>No source matches.</h2><p>Try a broader topic or clear the search. The atlas keeps the distinction between missing evidence and a negative finding visible.</p></div>
        )}

        {brief && (
          <section className="atlas-brief">
            <div className="atlas-brief__main">
              <span className="atlas-eyebrow">Saved synthesis / sealed</span>
              <h2>{brief.title}</h2>
              <p className="atlas-brief__summary">{brief.summary}</p>
              <p>{brief.plainLanguage}</p>
              <div className="atlas-themes">
                {brief.themes.filter((theme) => theme.sourceCount > 0).map((theme) => <div className="atlas-theme" key={theme.key}><strong>{theme.label}</strong><span>{theme.signal} · {theme.sourceCount} sources</span></div>)}
              </div>
            </div>
            <div className="atlas-brief__aside">
              <div className="atlas-brief__meta"><span>{brief.confidence} confidence</span><span>{brief.evidenceScore}/100 evidence</span><span>{brief.coverage}% coverage</span></div>
              <h2>Next responsible moves</h2>
              <ul className="atlas-action-list">{brief.actionSteps.map((step) => <li key={step}><Check size={15} aria-hidden="true" /><span>{step}</span></li>)}</ul>
              {brief.unsettled.length > 0 && <><h2>Still unsettled</h2><ul className="atlas-unsettled-list">{brief.unsettled.slice(0, 3).map((item) => <li key={item}><CircleAlert size={15} aria-hidden="true" /><span>{item}</span></li>)}</ul></>}
              <div className="atlas-detail__actions"><Link className="atlas-button" href={`/briefs/${brief.id}`}>Open saved brief <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
            </div>
          </section>
        )}

        <div className="atlas-section-heading">
          <div><span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>Commentary lens</span><h2>What smart people are arguing—and where they disagree.</h2></div>
          <p>Commentary is labeled separately from evidence. Each lens keeps a counterpoint so the atlas does not turn a podcast quote into a fact.</p>
        </div>
        <div className="atlas-commentary">
          {commentary.slice(0, 6).map((item) => <article className="atlas-commentary-card" key={item.id}><div className="atlas-commentary-card__author"><span>{item.author}</span><span>{item.stance}</span></div><p>{item.body}</p><small><strong>Counterpoint:</strong> {item.counterpoint}</small></article>)}
        </div>

        <div className="atlas-section-heading">
          <div><span className="atlas-eyebrow" style={{ color: "#1b8f7c" }}>Use it responsibly</span><h2>An evidence atlas is a starting point, not an oracle.</h2></div>
          <p>Read the original paper or transcript, inspect the method, involve affected people, and treat a high score as a prompt for review rather than a certification.</p>
        </div>
        <div className="quote-band" style={{ borderColor: "#101323", boxShadow: "6px 6px 0 #101323" }}>
          <div><blockquote>“The point is not to collect more links. It is to make the next decision more honest.”</blockquote><cite>Stewardship Ledger research protocol</cite></div>
          <div className="quote-band__aside"><ShieldCheck size={27} aria-hidden="true" /><p style={{ marginTop: 14 }}>Primary evidence, first-party reports, practitioner commentary, and offline fallback are separated in the interface so a reader can see the shape of the evidence before acting.</p></div>
        </div>
      </div>
    </div>
  );
}
