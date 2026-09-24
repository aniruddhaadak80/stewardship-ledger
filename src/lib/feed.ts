import { FALLBACK_FEED } from "./seals";
import type { FeedItem, FeedResponse } from "./types";

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(entry: string, tag: string): string {
  const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function arxivItems(xml: string): FeedItem[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match, index) => {
    const entry = match[1];
    const title = tagValue(entry, "title") || "Untitled safety research item";
    const summary = tagValue(entry, "summary") || "A new public safety and alignment research signal.";
    const linkMatch = entry.match(/<link[^>]+href=["']([^"']+)["']/i);
    const url = linkMatch?.[1] ?? "https://arxiv.org/";
    const published = tagValue(entry, "published") || new Date().toISOString();
    return {
      id: `arxiv-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
      title,
      summary,
      publishedAt: published,
      source: "arXiv",
      url,
      tags: ["AI safety", "research signal"],
      isLive: true,
    };
  });
}

function openAlexItems(payload: unknown): FeedItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results)) {
    return [];
  }
  return results.slice(0, 6).map((result, index) => {
    const item = (result ?? {}) as Record<string, unknown>;
    const title = typeof item.title === "string" ? item.title : "Untitled safety research item";
    const publicationDate = typeof item.publication_date === "string" ? item.publication_date : new Date().toISOString();
    const doi = typeof item.doi === "string" ? item.doi : "";
    return {
      id: `openalex-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
      title,
      summary: "A public research record surfaced through OpenAlex for stewardship review.",
      publishedAt: new Date(publicationDate).toISOString(),
      source: "OpenAlex",
      url: doi ? `https://doi.org/${doi.replace(/^https?:\/\/doi.org\//, "")}` : "https://openalex.org/",
      tags: ["research signal", "governance"],
      isLive: true,
    };
  });
}

export async function getSafetyFeed(): Promise<FeedResponse> {
  const arxivUrl = "https://export.arxiv.org/api/query?search_query=all:%22AI%20safety%22%20OR%20all:%22AI%20alignment%22&start=0&max_results=6&sortBy=submittedDate&sortOrder=descending";
  const openAlexUrl = "https://api.openalex.org/works?search=AI%20safety%20alignment&filter=from_publication_date:2025-01-01&sort=publication_date:desc&per-page=6";
  const results = await Promise.allSettled([
    fetch(arxivUrl, { next: { revalidate: 900 }, headers: { Accept: "application/atom+xml" } }),
    fetch(openAlexUrl, { next: { revalidate: 900 }, headers: { Accept: "application/json" } }),
  ]);
  const sources: FeedResponse["sources"] = [];
  const liveItems: FeedItem[] = [];

  if (results[0].status === "fulfilled" && results[0].value.ok) {
    const items = arxivItems(await results[0].value.text());
    liveItems.push(...items);
    sources.push({ name: "arXiv", live: true });
  } else {
    sources.push({ name: "arXiv", live: false });
  }

  if (results[1].status === "fulfilled" && results[1].value.ok) {
    const items = openAlexItems(await results[1].value.json());
    liveItems.push(...items);
    sources.push({ name: "OpenAlex", live: true });
  } else {
    sources.push({ name: "OpenAlex", live: false });
  }

  const unique = new Map<string, FeedItem>();
  [...liveItems, ...FALLBACK_FEED].forEach((item) => unique.set(item.title.toLowerCase(), item));
  const items = [...unique.values()].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)).slice(0, 10);
  return {
    items,
    fetchedAt: new Date().toISOString(),
    live: liveItems.length > 0,
    sources,
  };
}
