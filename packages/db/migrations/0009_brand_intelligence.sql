-- Complete the brand-intelligence workflow: richer monitoring profiles,
-- idempotent source findings, source coverage, and user-visible action history.

ALTER TABLE brand_configs ADD COLUMN keywords TEXT NOT NULL DEFAULT '[]';
ALTER TABLE brand_configs ADD COLUMN target_customer TEXT;
ALTER TABLE brand_configs ADD COLUMN monitoring_topics TEXT NOT NULL DEFAULT '[]';
ALTER TABLE brand_configs ADD COLUMN reddit_communities TEXT NOT NULL DEFAULT '[]';

-- Retain the exact prompt and distinguish provider failures from valid negative
-- responses. Existing rows predate these fields and remain successful records.
ALTER TABLE results ADD COLUMN prompt_text TEXT;
ALTER TABLE results ADD COLUMN provider_status TEXT NOT NULL DEFAULT 'success';
ALTER TABLE results ADD COLUMN error_message TEXT;

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT NOT NULL,
  author TEXT,
  published_at TEXT,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  engagement_score INTEGER,
  comment_count INTEGER,
  relevance_score INTEGER NOT NULL DEFAULT 0,
  intent TEXT NOT NULL DEFAULT 'general',
  matched_keywords TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'new',
  UNIQUE(project_id, source, source_record_id)
);

CREATE INDEX IF NOT EXISTS idx_findings_project_rank
  ON findings(project_id, status, relevance_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_project_source
  ON findings(project_id, source, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS finding_history (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_finding_history_project
  ON finding_history(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS finding_tasks (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_finding_tasks_project
  ON finding_tasks(project_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS signal_refreshes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_signal_refreshes_project
  ON signal_refreshes(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS source_syncs (
  id TEXT PRIMARY KEY,
  refresh_id TEXT NOT NULL REFERENCES signal_refreshes(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  records_seen INTEGER NOT NULL DEFAULT 0,
  records_matched INTEGER NOT NULL DEFAULT 0,
  source_updated_at TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_source_syncs_project_source
  ON source_syncs(project_id, source, created_at DESC);
