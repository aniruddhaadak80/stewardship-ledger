"use client";

import Link from "next/link";
import { Check, ExternalLink, FileText, MessageSquare, Mic2, Wrench } from "lucide-react";
import type { ResearchSource } from "@/lib/types";

const kindLabel = { paper: "Paper", report: "Report", podcast: "Podcast", commentary: "Commentary", tool: "Tool" } as const;
const kindIcon = { paper: FileText, report: FileText, podcast: Mic2, commentary: MessageSquare, tool: Wrench } as const;

export function ResearchSourceCard({ source, selected = false, onToggle }: { source: ResearchSource; selected?: boolean; onToggle?: (id: string) => void }) {
  const Icon = kindIcon[source.kind];
  return (
    <article className={`atlas-source-card ${selected ? "is-selected" : ""}`}>
      <div className="atlas-source-card__top"><span className={`atlas-kind atlas-kind--${source.kind}`}><Icon size={12} aria-hidden="true" /> {kindLabel[source.kind]}</span><span className={source.isLive ? "atlas-live" : ""}>{source.isLive ? "live" : source.evidenceGrade}</span></div>
      <h3>{source.title}</h3>
      <p>{source.summary}</p>
      <div className="atlas-topics">{source.topics.slice(0, 4).map((topic) => <span className="atlas-topic" key={topic}>{topic}</span>)}</div>
      <div className="atlas-source-card__footer"><span>{source.publisher} · {new Date(source.publishedAt).toLocaleDateString("en", { month: "short", year: "numeric" })}</span><div style={{ display: "flex", gap: 10, alignItems: "center" }}><a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.title} publisher record`}><ExternalLink size={14} aria-hidden="true" /> Record</a>{onToggle && <button type="button" className={selected ? "is-selected" : ""} onClick={() => onToggle(source.id)}>{selected ? <Check size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} {selected ? "Selected" : "Brief"}</button>}<Link href={`/sources/${source.id}`} aria-label={`Open ${source.title} details`}>Details <ExternalLink size={13} aria-hidden="true" /></Link></div></div>
    </article>
  );
}
