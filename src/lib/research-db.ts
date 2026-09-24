import { neon } from "@neondatabase/serverless";
import { createHash, randomUUID } from "node:crypto";
import { buildAlignmentBrief } from "./brief-engine";
import { canonicalJson } from "./canonical";
import { CURATED_COMMENTARY, CURATED_SOURCES } from "./research-catalog";
import { getResearchFeed } from "./research-feed";
import type { AlignmentBrief, BriefRecord, CommentaryLens, ResearchSource, Seal } from "./types";

const globalStore = globalThis as typeof globalThis & {
  __stewardshipResearchSources?: ResearchSource[];
  __stewardshipResearchCommentary?: CommentaryLens[];
  __stewardshipResearchBriefs?: BriefRecord[];
  __stewardshipResearchSeed?: Promise<void>;
};

type SqlClient = NonNullable<ReturnType<typeof neon>>;

function sqlClient(): SqlClient | null {
  return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
}

function dateValue(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function sourceDigest(source: Omit<ResearchSource, "sourceHash">): string {
  return createHash("sha256").update(canonicalJson(source)).digest("hex");
}

function normalizedSource(source: ResearchSource): ResearchSource {
  const content = Object.fromEntries(Object.entries(source).filter(([key]) => key !== "sourceHash")) as Omit<ResearchSource, "sourceHash">;
  return { ...content, sourceHash: sourceDigest(content) };
}

function memorySources(): ResearchSource[] {
  if (!globalStore.__stewardshipResearchSources) globalStore.__stewardshipResearchSources = CURATED_SOURCES.map(normalizedSource);
  return globalStore.__stewardshipResearchSources;
}

function memoryCommentary(): CommentaryLens[] {
  if (!globalStore.__stewardshipResearchCommentary) globalStore.__stewardshipResearchCommentary = structuredClone(CURATED_COMMENTARY);
  return globalStore.__stewardshipResearchCommentary;
}

function memoryBriefs(): BriefRecord[] {
  if (!globalStore.__stewardshipResearchBriefs) globalStore.__stewardshipResearchBriefs = [];
  return globalStore.__stewardshipResearchBriefs;
}

function sourceFromRow(row: Record<string, unknown>): ResearchSource {
  const topics = typeof row.topics === "string" ? JSON.parse(row.topics) : row.topics;
  return {
    id: String(row.id), kind: String(row.kind) as ResearchSource["kind"], title: String(row.title), publisher: String(row.publisher), authors: String(row.authors), publishedAt: dateValue(row.published_at), url: String(row.url), summary: String(row.summary), keyClaim: String(row.key_claim), limitations: String(row.limitations), topics: Array.isArray(topics) ? topics.map(String) : [], evidenceGrade: String(row.evidence_grade) as ResearchSource["evidenceGrade"], stance: String(row.stance) as ResearchSource["stance"], isLive: Boolean(row.is_live), fetchedAt: row.fetched_at ? dateValue(row.fetched_at) : null, sourceHash: String(row.source_hash),
  };
}

function commentaryFromRow(row: Record<string, unknown>): CommentaryLens {
  return { id: String(row.id), sourceId: String(row.source_id), author: String(row.author), role: String(row.role), stance: String(row.stance) as CommentaryLens["stance"], body: String(row.body), counterpoint: String(row.counterpoint), url: String(row.url), publishedAt: dateValue(row.published_at) };
}

function briefFromRow(row: Record<string, unknown>): BriefRecord {
  const brief = typeof row.brief_json === "string" ? JSON.parse(row.brief_json) : row.brief_json;
  const seal = typeof row.seal === "string" ? JSON.parse(row.seal) : row.seal;
  return { ...(brief as AlignmentBrief), id: String(row.id), caseId: row.case_id ? String(row.case_id) : null, createdAt: dateValue(row.created_at), updatedAt: dateValue(row.updated_at), deletedAt: row.deleted_at ? dateValue(row.deleted_at) : null, version: Number(row.version), seal: seal as Seal };
}

async function ensureResearchSeed(): Promise<void> {
  if (!globalStore.__stewardshipResearchSeed) {
    globalStore.__stewardshipResearchSeed = (async () => {
      const sql = sqlClient();
      if (!sql) return;
      const sourceCount = (await sql`SELECT COUNT(*)::int AS count FROM research_sources`) as unknown as Array<{ count: number }>;
      if (Number(sourceCount[0]?.count ?? 0) === 0) {
        for (const raw of CURATED_SOURCES) {
          const source = normalizedSource(raw);
          await sql`INSERT INTO research_sources (id, kind, title, publisher, authors, published_at, url, summary, key_claim, limitations, topics, evidence_grade, stance, is_live, fetched_at, source_hash, created_at, updated_at) VALUES (${source.id}, ${source.kind}, ${source.title}, ${source.publisher}, ${source.authors}, ${source.publishedAt}, ${source.url}, ${source.summary}, ${source.keyClaim}, ${source.limitations}, ${JSON.stringify(source.topics)}::jsonb, ${source.evidenceGrade}, ${source.stance}, ${source.isLive}, ${source.fetchedAt}, ${source.sourceHash}, ${source.publishedAt}, ${source.publishedAt}) ON CONFLICT (id) DO NOTHING`;
        }
      }
      const commentaryCount = (await sql`SELECT COUNT(*)::int AS count FROM research_commentary`) as unknown as Array<{ count: number }>;
      if (Number(commentaryCount[0]?.count ?? 0) === 0) {
        for (const item of CURATED_COMMENTARY) {
          await sql`INSERT INTO research_commentary (id, source_id, author, role, stance, body, counterpoint, url, published_at, created_at) VALUES (${item.id}, ${item.sourceId}, ${item.author}, ${item.role}, ${item.stance}, ${item.body}, ${item.counterpoint}, ${item.url}, ${item.publishedAt}, ${item.publishedAt}) ON CONFLICT (id) DO NOTHING`;
        }
      }
    })();
  }
  try { await globalStore.__stewardshipResearchSeed; } catch (error) { globalStore.__stewardshipResearchSeed = undefined; throw error; }
}

export async function listResearchSources(options: { query?: string; kind?: string; topic?: string } = {}): Promise<ResearchSource[]> {
  const sql = sqlClient();
  const query = options.query?.toLowerCase().trim();
  if (!sql) return memorySources().filter((source) => !options.kind || source.kind === options.kind).filter((source) => !options.topic || source.topics.includes(options.topic)).filter((source) => !query || `${source.title} ${source.publisher} ${source.summary} ${source.topics.join(" ")}`.toLowerCase().includes(query)).sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  await ensureResearchSeed();
  const rows = (await sql`SELECT * FROM research_sources ORDER BY published_at DESC LIMIT 200`) as unknown as Array<Record<string, unknown>>;
  return rows.map(sourceFromRow).filter((source) => !options.kind || source.kind === options.kind).filter((source) => !options.topic || source.topics.includes(options.topic)).filter((source) => !query || `${source.title} ${source.publisher} ${source.summary} ${source.topics.join(" ")}`.toLowerCase().includes(query));
}

export async function getResearchSource(id: string): Promise<ResearchSource | null> {
  const sql = sqlClient();
  if (!sql) return memorySources().find((source) => source.id === id) ?? null;
  await ensureResearchSeed();
  const rows = (await sql`SELECT * FROM research_sources WHERE id = ${id} LIMIT 1`) as unknown as Array<Record<string, unknown>>;
  return rows[0] ? sourceFromRow(rows[0]) : null;
}

export async function listCommentary(sourceId?: string): Promise<CommentaryLens[]> {
  const sql = sqlClient();
  if (!sql) return memoryCommentary().filter((item) => !sourceId || item.sourceId === sourceId);
  await ensureResearchSeed();
  const rows = sourceId ? (await sql`SELECT * FROM research_commentary WHERE source_id = ${sourceId} ORDER BY published_at DESC`) as unknown as Array<Record<string, unknown>> : (await sql`SELECT * FROM research_commentary ORDER BY published_at DESC`) as unknown as Array<Record<string, unknown>>;
  return rows.map(commentaryFromRow);
}

export async function refreshResearchSources(): Promise<{ imported: number; live: boolean; fetchedAt: string }> {
  const feed = await getResearchFeed();
  const sql = sqlClient();
  if (!sql) {
    const memory = memorySources();
    for (const source of feed.sources) {
      const index = memory.findIndex((item) => item.id === source.id || item.url === source.url);
      const normalized = normalizedSource(source);
      if (index >= 0) memory[index] = normalized; else memory.push(normalized);
    }
    return { imported: feed.sources.length, live: feed.live, fetchedAt: feed.fetchedAt };
  }
  await ensureResearchSeed();
  for (const raw of feed.sources) {
    const source = normalizedSource(raw);
    await sql`INSERT INTO research_sources (id, kind, title, publisher, authors, published_at, url, summary, key_claim, limitations, topics, evidence_grade, stance, is_live, fetched_at, source_hash, created_at, updated_at) VALUES (${source.id}, ${source.kind}, ${source.title}, ${source.publisher}, ${source.authors}, ${source.publishedAt}, ${source.url}, ${source.summary}, ${source.keyClaim}, ${source.limitations}, ${JSON.stringify(source.topics)}::jsonb, ${source.evidenceGrade}, ${source.stance}, ${source.isLive}, ${source.fetchedAt}, ${source.sourceHash}, ${source.publishedAt}, ${new Date().toISOString()}) ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, title = EXCLUDED.title, publisher = EXCLUDED.publisher, authors = EXCLUDED.authors, published_at = EXCLUDED.published_at, url = EXCLUDED.url, summary = EXCLUDED.summary, key_claim = EXCLUDED.key_claim, limitations = EXCLUDED.limitations, topics = EXCLUDED.topics, evidence_grade = EXCLUDED.evidence_grade, stance = EXCLUDED.stance, is_live = EXCLUDED.is_live, fetched_at = EXCLUDED.fetched_at, source_hash = EXCLUDED.source_hash, updated_at = EXCLUDED.updated_at`;
  }
  return { imported: feed.sources.length, live: feed.live, fetchedAt: feed.fetchedAt };
}

function briefSeal(brief: AlignmentBrief, previousSeal: string, sealedAt: string): Seal {
  return { algorithm: "SHA-384", digest: createHash("sha384").update(`${previousSeal}${canonicalJson(brief)}`).digest("hex"), previousSeal, sealedAt };
}

function briefContent(brief: AlignmentBrief | BriefRecord): AlignmentBrief {
  return {
    title: brief.title,
    question: brief.question,
    summary: brief.summary,
    plainLanguage: brief.plainLanguage,
    unsettled: brief.unsettled,
    actionSteps: brief.actionSteps,
    themes: brief.themes,
    sourceIds: brief.sourceIds,
    coverage: brief.coverage,
    confidence: brief.confidence,
    evidenceScore: brief.evidenceScore,
  };
}

export async function previewBrief(sourceIds: string[] = [], question?: string, title?: string): Promise<AlignmentBrief> {
  const all = await listResearchSources();
  const selected = sourceIds.length ? all.filter((source) => sourceIds.includes(source.id)) : all;
  return buildAlignmentBrief(selected, question, title);
}

export async function createBrief(input: { sourceIds?: string[]; question?: string; title?: string; caseId?: string | null }): Promise<BriefRecord> {
  const brief = await previewBrief(input.sourceIds, input.question, input.title);
  const now = new Date().toISOString();
  const id = randomUUID();
  const seal = briefSeal(brief, "0".repeat(96), now);
  const record: BriefRecord = { ...brief, id, caseId: input.caseId ?? null, createdAt: now, updatedAt: now, deletedAt: null, version: 1, seal };
  const sql = sqlClient();
  if (!sql) { memoryBriefs().unshift(record); return structuredClone(record); }
  await sql`INSERT INTO briefs (id, case_id, brief_json, source_ids, created_at, updated_at, deleted_at, version, seal) VALUES (${id}, ${record.caseId}, ${JSON.stringify(brief)}::jsonb, ${JSON.stringify(brief.sourceIds)}::jsonb, ${now}, ${now}, NULL, 1, ${JSON.stringify(seal)}::jsonb)`;
  return record;
}

export async function listBriefs(includeDeleted = false): Promise<BriefRecord[]> {
  const sql = sqlClient();
  if (!sql) return memoryBriefs().filter((brief) => includeDeleted || !brief.deletedAt).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const rows = (await sql`SELECT * FROM briefs ${includeDeleted ? sql`` : sql`WHERE deleted_at IS NULL`} ORDER BY updated_at DESC`) as unknown as Array<Record<string, unknown>>;
  return rows.map(briefFromRow);
}

export async function getBrief(id: string, includeDeleted = false): Promise<BriefRecord | null> {
  const sql = sqlClient();
  if (!sql) { const brief = memoryBriefs().find((item) => item.id === id); return brief && (includeDeleted || !brief.deletedAt) ? structuredClone(brief) : null; }
  const rows = (await sql`SELECT * FROM briefs WHERE id = ${id} ${includeDeleted ? sql`` : sql`AND deleted_at IS NULL`} LIMIT 1`) as unknown as Array<Record<string, unknown>>;
  return rows[0] ? briefFromRow(rows[0]) : null;
}

export async function updateBrief(id: string, input: { sourceIds?: string[]; question?: string; title?: string }): Promise<BriefRecord | null> {
  const current = await getBrief(id);
  if (!current) return null;
  const brief = await previewBrief(input.sourceIds ?? current.sourceIds, input.question ?? current.question, input.title ?? current.title);
  const now = new Date().toISOString();
  const version = current.version + 1;
  const seal = briefSeal(brief, current.seal.digest, now);
  const next: BriefRecord = { ...current, ...brief, updatedAt: now, version, seal };
  const sql = sqlClient();
  if (!sql) { const records = memoryBriefs(); const index = records.findIndex((item) => item.id === id); records[index] = next; return structuredClone(next); }
  await sql`UPDATE briefs SET brief_json = ${JSON.stringify(brief)}::jsonb, source_ids = ${JSON.stringify(brief.sourceIds)}::jsonb, updated_at = ${now}, version = ${version}, seal = ${JSON.stringify(seal)}::jsonb WHERE id = ${id}`;
  return next;
}

export function storageMode(): "neon" | "memory" {
  return process.env.DATABASE_URL ? "neon" : "memory";
}

export async function archiveBrief(id: string): Promise<BriefRecord | null> {
  const current = await getBrief(id);
  if (!current) return null;
  const now = new Date().toISOString();
  const version = current.version + 1;
  const seal = briefSeal(briefContent(current), current.seal.digest, now);
  const next = { ...current, updatedAt: now, deletedAt: now, version, seal };
  const sql = sqlClient();
  if (!sql) { const records = memoryBriefs(); const index = records.findIndex((item) => item.id === id); records[index] = next; return structuredClone(next); }
  await sql`UPDATE briefs SET updated_at = ${now}, deleted_at = ${now}, version = ${version}, seal = ${JSON.stringify(seal)}::jsonb WHERE id = ${id}`;
  return next;
}
