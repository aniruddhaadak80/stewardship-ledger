import { createHash } from "node:crypto";
import { CURATED_COMMENTARY, CURATED_SOURCES } from "./research-catalog";
import type { ResearchFeedResponse, ResearchSource, SourceStance } from "./types";

function decodeXml(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function stripHtml(value: string): string {
  return decodeXml(value).slice(0, 1000);
}

function safeDate(value: unknown): string {
  const date = new Date(typeof value === "string" ? value : "");
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function stableId(prefix: string, value: string): string {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 16);
  return `${prefix}-${digest}`;
}

function sourceHash(value: Omit<ResearchSource, "sourceHash">): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function makeSource(value: Omit<ResearchSource, "sourceHash" | "isLive" | "fetchedAt">): ResearchSource {
  const base = { ...value, isLive: true, fetchedAt: new Date().toISOString() };
  return { ...base, sourceHash: sourceHash(base) };
}

function arxivSources(xml: string): ResearchSource[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => {
    const entry = match[1];
    const title = decodeXml(entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "Untitled research item");
    const summary = stripHtml(entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ?? "A public alignment research signal.");
    const link = entry.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? "https://arxiv.org/";
    const published = safeDate(entry.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]);
    const topics = ["agents", "alignment", "evals", "monitoring"].filter((topic) => `${title} ${summary}`.toLowerCase().includes(topic));
    return makeSource({ id: stableId("arxiv", link), kind: "paper", title, publisher: "arXiv", authors: "arXiv authors", publishedAt: published, url: link, summary, keyClaim: summary.slice(0, 280), limitations: "A preprint signal; inspect the paper, methods, and replication status before relying on it.", topics: topics.length ? topics : ["alignment"], evidenceGrade: "primary", stance: "mixed" as SourceStance });
  });
}

function openAlexSources(payload: unknown): ResearchSource[] {
  if (!payload || typeof payload !== "object") return [];
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];
  return results.slice(0, 8).map((value) => {
    const item = (value ?? {}) as Record<string, unknown>;
    const title = typeof item.title === "string" ? item.title : "Untitled research item";
    const doi = typeof item.doi === "string" ? item.doi : typeof item.id === "string" ? item.id : stableId("openalex", JSON.stringify(item));
    const url = doi.startsWith("http") ? doi : `https://doi.org/${doi.replace(/^https?:\/\/doi.org\//, "")}`;
    const publishedAt = safeDate(item.publication_date);
    return makeSource({ id: stableId("openalex", url), kind: "paper", title, publisher: "OpenAlex", authors: "OpenAlex indexed authors", publishedAt, url, summary: "A public scholarly record surfaced for alignment and oversight review.", keyClaim: "Use the publisher record to inspect the full claim, method, and limitations.", limitations: "Index metadata is not a substitute for reading the paper or checking its evidence quality.", topics: ["alignment", "evals", "research"], evidenceGrade: "primary", stance: "mixed" });
  });
}

function rssItems(xml: string, podcastTitle: string, podcastUrl: string): ResearchSource[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 3).map((match) => {
    const item = match[1];
    const title = decodeXml(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "Untitled podcast episode");
    const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || podcastUrl;
    const description = stripHtml(item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? "A podcast conversation about frontier AI research and governance.");
    const publishedAt = safeDate(item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]);
    const guid = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim() || link;
    return makeSource({ id: stableId("podcast", guid), kind: "podcast", title, publisher: podcastTitle, authors: podcastTitle, publishedAt, url: link, summary: description, keyClaim: description.slice(0, 280), limitations: "An attributed conversation is context, not a substitute for the linked paper, transcript, or evidence.", topics: ["alignment", "oversight", "commentary"], evidenceGrade: "commentary", stance: "mixed", });
  });
}

async function podcastSources(): Promise<{ sources: ResearchSource[]; live: boolean }> {
  const podcastIds = [
    { id: "1888046207", title: "AE Alignment Podcast", url: "https://podcasts.apple.com/us/podcast/ae-alignment-podcast/id1888046207" },
    { id: "1245002988", title: "80,000 Hours Podcast", url: "https://podcasts.apple.com/us/podcast/80000-hours-podcast/id1245002988" },
    { id: "1892206689", title: "Frontier Systems", url: "https://podcasts.apple.com/us/podcast/frontier-systems/id1892206689" },
  ];
  const results = await Promise.allSettled(podcastIds.map(async (podcast) => {
    const lookup = await fetch(`https://itunes.apple.com/lookup?id=${podcast.id}&entity=podcast`, { next: { revalidate: 900 } });
    if (!lookup.ok) throw new Error("Podcast lookup failed");
    const payload = await lookup.json() as { results?: Array<{ feedUrl?: string; collectionName?: string }> };
    const feedUrl = payload.results?.[0]?.feedUrl;
    if (!feedUrl) throw new Error("Podcast feed unavailable");
    const feed = await fetch(feedUrl, { next: { revalidate: 900 } });
    if (!feed.ok) throw new Error("Podcast RSS failed");
    return rssItems(await feed.text(), payload.results?.[0]?.collectionName ?? podcast.title, podcast.url);
  }));
  const sources = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  return { sources, live: sources.length > 0 };
}

export async function getResearchFeed(): Promise<ResearchFeedResponse> {
  const arxivUrl = "https://export.arxiv.org/api/query?search_query=all:%22AI%20safety%22%20OR%20all:%22AI%20alignment%22&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending";
  const openAlexUrl = "https://api.openalex.org/works?search=AI%20safety%20alignment&filter=from_publication_date:2025-01-01&sort=publication_date:desc&per-page=8";
  const [arxivResult, openAlexResult, podcastResult] = await Promise.allSettled([
    fetch(arxivUrl, { next: { revalidate: 900 }, headers: { Accept: "application/atom+xml" } }),
    fetch(openAlexUrl, { next: { revalidate: 900 }, headers: { Accept: "application/json" } }),
    podcastSources(),
  ]);
  const liveSources: ResearchSource[] = [];
  const providers: ResearchFeedResponse["providers"] = [];
  if (arxivResult.status === "fulfilled" && arxivResult.value.ok) {
    liveSources.push(...arxivSources(await arxivResult.value.text()));
    providers.push({ name: "arXiv", live: true });
  } else providers.push({ name: "arXiv", live: false });
  if (openAlexResult.status === "fulfilled" && openAlexResult.value.ok) {
    liveSources.push(...openAlexSources(await openAlexResult.value.json()));
    providers.push({ name: "OpenAlex", live: true });
  } else providers.push({ name: "OpenAlex", live: false });
  if (podcastResult.status === "fulfilled" && podcastResult.value.live) {
    liveSources.push(...podcastResult.value.sources);
    providers.push({ name: "Apple Podcasts RSS", live: true });
  } else providers.push({ name: "Apple Podcasts RSS", live: false });
  const merged = new Map<string, ResearchSource>();
  [...liveSources, ...CURATED_SOURCES].forEach((item) => {
    const key = item.url.toLowerCase();
    if (!merged.has(key)) merged.set(key, item);
  });
  return { sources: [...merged.values()].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)).slice(0, 36), commentary: CURATED_COMMENTARY, fetchedAt: new Date().toISOString(), live: liveSources.length > 0, providers };
}
