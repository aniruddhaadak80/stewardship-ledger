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

CREATE TABLE IF NOT EXISTS feed_cache (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL
);
