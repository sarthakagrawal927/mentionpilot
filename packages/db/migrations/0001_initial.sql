-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Projects (a user can monitor multiple brands)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- Brand config (one per project)
CREATE TABLE IF NOT EXISTS brand_configs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_aliases TEXT NOT NULL DEFAULT '[]',
  brand_url TEXT,
  competitors TEXT NOT NULL DEFAULT '[]',
  platforms TEXT NOT NULL DEFAULT '["openai","anthropic","google","perplexity"]',
  openai_api_key TEXT,
  anthropic_api_key TEXT,
  google_api_key TEXT,
  perplexity_api_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id)
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prompts_project ON prompts(project_id);

-- Checks (one per run)
CREATE TABLE IF NOT EXISTS checks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  total_queries INTEGER NOT NULL DEFAULT 0,
  completed_queries INTEGER NOT NULL DEFAULT 0,
  brand_mention_rate REAL,
  summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_checks_project ON checks(project_id, created_at DESC);

-- Results (one per prompt x platform)
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  check_id TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  model TEXT NOT NULL,
  response_text TEXT NOT NULL,
  brand_mentioned INTEGER NOT NULL DEFAULT 0,
  brand_sentiment TEXT,
  brand_position INTEGER,
  competitors_mentioned TEXT NOT NULL DEFAULT '[]',
  citations TEXT NOT NULL DEFAULT '[]',
  brand_cited INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_results_check ON results(check_id);
