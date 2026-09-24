"use client";

import Link from "next/link";
import { ArrowUpRight, LoaderCircle, Radio, Rss, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import type { FeedResponse } from "@/lib/types";

export function SignalFeed({ compact = false }: { compact?: boolean }) {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/feed")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Feed unavailable");
        }
        return response.json() as Promise<FeedResponse>;
      })
      .then((value) => {
        if (active) {
          setFeed(value);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="feed-error"><WifiOff size={17} aria-hidden="true" /> The live signal is quiet; the sealed sample remains available.</div>;
  }

  if (!feed) {
    return <div className="feed-loading"><LoaderCircle className="spin" size={17} aria-hidden="true" /> Reading public signals…</div>;
  }

  return (
    <div className={`signal-feed ${compact ? "signal-feed--compact" : ""}`}>
      <div className="signal-feed__head">
        <span><Radio size={15} aria-hidden="true" /> {feed.live ? "Live public signals" : "Sealed offline signals"}</span>
        <small>{feed.sources.map((source) => `${source.name} ${source.live ? "online" : "fallback"}`).join(" · ")}</small>
      </div>
      <div className="signal-list">
        {feed.items.slice(0, compact ? 3 : 5).map((item) => (
          <Link className="signal-item" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
            <span className="signal-item__source">{item.source}</span>
            <strong>{item.title}</strong>
            <small>{new Date(item.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</small>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
      {!compact && <div className="feed-attribution"><Rss size={14} aria-hidden="true" /> Sources: arXiv, OpenAlex · links open the publisher record.</div>}
    </div>
  );
}
