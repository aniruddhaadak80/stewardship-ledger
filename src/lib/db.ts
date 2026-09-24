import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { evaluateCase, normalizeCase, normalizeStatus } from "./engine";
import { createSeal, FALLBACK_CASES, GENESIS_SEAL, verifySealChain } from "./seals";
import type { CaseDraft, CaseRecord, CaseStatus } from "./types";

const globalStore = globalThis as typeof globalThis & {
  __stewardshipCases?: CaseRecord[];
  __stewardshipSeed?: Promise<void>;
};

function sqlClient() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

function memoryCases(): CaseRecord[] {
  if (!globalStore.__stewardshipCases) {
    globalStore.__stewardshipCases = FALLBACK_CASES.map((record) => structuredClone(record));
  }
  return globalStore.__stewardshipCases;
}

function latestSeal(records: CaseRecord[]): string {
  const latest = [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  return latest?.seal.digest ?? GENESIS_SEAL;
}

function dateValue(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function recordFromRow(row: Record<string, unknown>): CaseRecord {
  const score = typeof row.score_json === "string" ? JSON.parse(row.score_json) : row.score_json;
  const history = typeof row.history === "string" ? JSON.parse(row.history) : row.history;
  return {
    id: String(row.id),
    title: String(row.title),
    system: String(row.system),
    context: String(row.context),
    autonomy: Number(row.autonomy),
    reversibility: Number(row.reversibility),
    oversight: Number(row.oversight),
    affected: Number(row.affected),
    voice: Number(row.voice),
    safeguards: String(row.safeguards),
    owner: String(row.owner),
    status: String(row.status) as CaseStatus,
    createdAt: dateValue(row.created_at),
    updatedAt: dateValue(row.updated_at),
    deletedAt: row.deleted_at ? dateValue(row.deleted_at) : null,
    version: Number(row.version),
    score: score as CaseRecord["score"],
    seal: typeof row.seal === "string" ? JSON.parse(row.seal) : row.seal,
    history: Array.isArray(history) ? history : [],
  };
}

async function ensureDatabaseSeed(): Promise<void> {
  if (!globalStore.__stewardshipSeed) {
    globalStore.__stewardshipSeed = (async () => {
      const sql = sqlClient();
      if (!sql) {
        return;
      }
      const countRows = (await sql`SELECT COUNT(*)::int AS count FROM stewardship_cases`) as unknown as Array<{ count: number }>;
      if (Number(countRows[0]?.count ?? 0) > 0) {
        return;
      }
      for (const record of FALLBACK_CASES) {
        await sql`
          INSERT INTO stewardship_cases
            (id, title, system, context, autonomy, reversibility, oversight, affected, voice, safeguards, owner, status, created_at, updated_at, deleted_at, version, score_json, seal, history)
          VALUES
            (${record.id}, ${record.title}, ${record.system}, ${record.context}, ${record.autonomy}, ${record.reversibility}, ${record.oversight}, ${record.affected}, ${record.voice}, ${record.safeguards}, ${record.owner}, ${record.status}, ${record.createdAt}, ${record.updatedAt}, ${record.deletedAt}, ${record.version}, ${JSON.stringify(record.score)}::jsonb, ${JSON.stringify(record.seal)}::jsonb, ${JSON.stringify(record.history)}::jsonb)
          ON CONFLICT (id) DO NOTHING
        `;
      }
    })();
  }
  try {
    await globalStore.__stewardshipSeed;
  } catch (error) {
    globalStore.__stewardshipSeed = undefined;
    throw error;
  }
}

export async function pingDatabase(): Promise<{ configured: boolean; ok: boolean }> {
  const sql = sqlClient();
  if (!sql) {
    return { configured: false, ok: true };
  }
  try {
    await sql`SELECT 1`;
    return { configured: true, ok: true };
  } catch {
    return { configured: true, ok: false };
  }
}

export async function listCases(options: { query?: string; status?: string; includeDeleted?: boolean } = {}): Promise<CaseRecord[]> {
  const sql = sqlClient();
  if (!sql) {
    const query = options.query?.toLowerCase().trim();
    return memoryCases()
      .filter((record) => options.includeDeleted || !record.deletedAt)
      .filter((record) => !options.status || record.status === options.status)
      .filter((record) => !query || `${record.title} ${record.system} ${record.context} ${record.owner}`.toLowerCase().includes(query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  await ensureDatabaseSeed();
  const query = options.query?.trim() || null;
  const status = options.status || null;
  const rows = (await sql`
    SELECT * FROM stewardship_cases
    WHERE (${query}::text IS NULL OR title ILIKE '%' || ${query}::text || '%' OR system ILIKE '%' || ${query}::text || '%' OR context ILIKE '%' || ${query}::text || '%' OR owner ILIKE '%' || ${query}::text || '%')
      AND (${status}::text IS NULL OR status = ${status}::text)
      AND (${options.includeDeleted ? true : false}::boolean OR deleted_at IS NULL)
    ORDER BY updated_at DESC
  `) as unknown as Array<Record<string, unknown>>;
  return rows.map(recordFromRow);
}

export async function getCase(id: string, includeDeleted = false): Promise<CaseRecord | null> {
  const sql = sqlClient();
  if (!sql) {
    const record = memoryCases().find((item) => item.id === id);
    return record && (includeDeleted || !record.deletedAt) ? structuredClone(record) : null;
  }
  await ensureDatabaseSeed();
  const rows = (await sql`
    SELECT * FROM stewardship_cases WHERE id = ${id} ${includeDeleted ? sql`` : sql`AND deleted_at IS NULL`} LIMIT 1
  `) as unknown as Array<Record<string, unknown>>;
  return rows[0] ? recordFromRow(rows[0]) : null;
}

export async function createCase(draft: CaseDraft, actor = "public steward"): Promise<CaseRecord> {
  const fields = normalizeCase(draft);
  const status = normalizeStatus(draft.status ?? "active");
  const now = new Date().toISOString();
  const score = evaluateCase(fields);
  const id = randomUUID();
  const sql = sqlClient();

  if (sql) {
    await ensureDatabaseSeed();
    const latestRows = (await sql`SELECT seal FROM stewardship_cases ORDER BY created_at ASC`) as unknown as Array<{ seal: Record<string, unknown> | string }>;
    const previousSeal = latestRows.reduce((head, row) => {
      if (typeof row.seal === "string") {
        try {
          return String(JSON.parse(row.seal).digest ?? head);
        } catch {
          return head;
        }
      }
      return String(row.seal.digest ?? head);
    }, GENESIS_SEAL);
    const seal = createSeal(fields, score, previousSeal, now);
    const revision = { id: `${id}-v1`, actor, action: "created" as const, at: now, seal: seal.digest };
    await sql`
      INSERT INTO stewardship_cases
        (id, title, system, context, autonomy, reversibility, oversight, affected, voice, safeguards, owner, status, created_at, updated_at, deleted_at, version, score_json, seal, history)
      VALUES
        (${id}, ${fields.title}, ${fields.system}, ${fields.context}, ${fields.autonomy}, ${fields.reversibility}, ${fields.oversight}, ${fields.affected}, ${fields.voice}, ${fields.safeguards}, ${fields.owner}, ${status}, ${now}, ${now}, NULL, 1, ${JSON.stringify(score)}::jsonb, ${JSON.stringify(seal)}::jsonb, ${JSON.stringify([revision])}::jsonb)
    `;
    return { ...fields, id, status, createdAt: now, updatedAt: now, deletedAt: null, version: 1, score, seal, history: [revision] };
  }

  const records = memoryCases();
  const previousSeal = latestSeal(records);
  const seal = createSeal(fields, score, previousSeal, now);
  const revision = { id: `${id}-v1`, actor, action: "created" as const, at: now, seal: seal.digest };
  const record: CaseRecord = { ...fields, id, status, createdAt: now, updatedAt: now, deletedAt: null, version: 1, score, seal, history: [revision] };
  records.unshift(record);
  return structuredClone(record);
}

export async function updateCase(id: string, patch: Partial<CaseDraft>, actor = "public steward"): Promise<CaseRecord | null> {
  const current = await getCase(id);
  if (!current) {
    return null;
  }
  const fields = normalizeCase({ ...current, ...patch });
  const status = patch.status ? normalizeStatus(patch.status) : current.status;
  const now = new Date().toISOString();
  const score = evaluateCase(fields);
  const seal = createSeal(fields, score, current.seal.digest, now);
  const version = current.version + 1;
  const revision = { id: `${id}-v${version}`, actor, action: "updated" as const, at: now, seal: seal.digest };
  const next: CaseRecord = { ...current, ...fields, status, updatedAt: now, version, score, seal, history: [...current.history, revision] };
  const sql = sqlClient();

  if (sql) {
    await sql`
      UPDATE stewardship_cases
      SET title = ${fields.title}, system = ${fields.system}, context = ${fields.context}, autonomy = ${fields.autonomy}, reversibility = ${fields.reversibility}, oversight = ${fields.oversight}, affected = ${fields.affected}, voice = ${fields.voice}, safeguards = ${fields.safeguards}, owner = ${fields.owner}, status = ${status}, updated_at = ${now}, version = ${version}, score_json = ${JSON.stringify(score)}::jsonb, seal = ${JSON.stringify(seal)}::jsonb, history = ${JSON.stringify(next.history)}::jsonb
      WHERE id = ${id}
    `;
  } else {
    const records = memoryCases();
    const index = records.findIndex((record) => record.id === id);
    records[index] = next;
  }
  return structuredClone(next);
}

export async function archiveCase(id: string, actor = "public steward"): Promise<CaseRecord | null> {
  const current = await getCase(id);
  if (!current) {
    return null;
  }
  const now = new Date().toISOString();
  const score = evaluateCase(current);
  const seal = createSeal(current, score, current.seal.digest, now);
  const version = current.version + 1;
  const revision = { id: `${id}-v${version}`, actor, action: "retired" as const, at: now, seal: seal.digest };
  const next: CaseRecord = { ...current, status: "retired", updatedAt: now, deletedAt: now, version, score, seal, history: [...current.history, revision] };
  const sql = sqlClient();
  if (sql) {
    await sql`
      UPDATE stewardship_cases
      SET status = 'retired', deleted_at = ${now}, updated_at = ${now}, version = ${version}, score_json = ${JSON.stringify(score)}::jsonb, seal = ${JSON.stringify(seal)}::jsonb, history = ${JSON.stringify(next.history)}::jsonb
      WHERE id = ${id}
    `;
  } else {
    const records = memoryCases();
    const index = records.findIndex((record) => record.id === id);
    records[index] = next;
  }
  return structuredClone(next);
}

export async function verifyChain(): Promise<ReturnType<typeof verifySealChain>> {
  const records = await listCases({ includeDeleted: true });
  return verifySealChain(records);
}

export function storageMode(): "neon" | "memory" {
  return process.env.DATABASE_URL ? "neon" : "memory";
}
