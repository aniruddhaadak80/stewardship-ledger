CREATE TABLE IF NOT EXISTS stewardship_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  system TEXT NOT NULL,
  context TEXT NOT NULL,
  autonomy INTEGER NOT NULL CHECK (autonomy BETWEEN 0 AND 100),
  reversibility INTEGER NOT NULL CHECK (reversibility BETWEEN 0 AND 100),
  oversight INTEGER NOT NULL CHECK (oversight BETWEEN 0 AND 100),
  affected INTEGER NOT NULL CHECK (affected BETWEEN 0 AND 100),
  voice INTEGER NOT NULL CHECK (voice BETWEEN 0 AND 100),
  safeguards TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'review', 'retired')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  score_json JSONB NOT NULL,
  seal JSONB NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS stewardship_cases_updated_at_idx ON stewardship_cases (updated_at DESC);
CREATE INDEX IF NOT EXISTS stewardship_cases_status_idx ON stewardship_cases (status);

CREATE TABLE IF NOT EXISTS stewardship_head (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  head TEXT NOT NULL
);

INSERT INTO stewardship_head (id, head)
VALUES (1, repeat('0', 96))
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS research_sources (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('paper', 'report', 'podcast', 'commentary', 'tool')),
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  authors TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  url TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_claim TEXT NOT NULL,
  limitations TEXT NOT NULL,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_grade TEXT NOT NULL CHECK (evidence_grade IN ('primary', 'synthesis', 'first-party', 'experimental', 'commentary')),
  stance TEXT NOT NULL CHECK (stance IN ('constructive', 'cautionary', 'mixed', 'skeptical', 'optimistic')),
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  fetched_at TIMESTAMPTZ,
  source_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS research_sources_kind_idx ON research_sources (kind);
CREATE INDEX IF NOT EXISTS research_sources_published_at_idx ON research_sources (published_at DESC);

CREATE TABLE IF NOT EXISTS research_commentary (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT NOT NULL,
  stance TEXT NOT NULL CHECK (stance IN ('constructive', 'cautionary', 'mixed', 'skeptical', 'optimistic')),
  body TEXT NOT NULL,
  counterpoint TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS research_commentary_source_idx ON research_commentary (source_id);

CREATE TABLE IF NOT EXISTS briefs (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  brief_json JSONB NOT NULL,
  source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  seal JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS briefs_updated_at_idx ON briefs (updated_at DESC);

CREATE TABLE IF NOT EXISTS feed_cache (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL
);
