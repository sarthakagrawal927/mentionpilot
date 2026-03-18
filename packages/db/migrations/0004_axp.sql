-- AXP: Optimized page versions served to AI bots
CREATE TABLE IF NOT EXISTS axp_pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_path TEXT NOT NULL,
  title TEXT,
  optimized_content TEXT NOT NULL,
  source_token_count INTEGER,
  optimized_token_count INTEGER,
  last_crawled_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_modified_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_axp_pages_project ON axp_pages(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_axp_pages_path ON axp_pages(project_id, source_path);

-- AXP: Bot visit logs
CREATE TABLE IF NOT EXISTS axp_bot_visits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bot_name TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  path TEXT NOT NULL,
  served_optimized INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_axp_bot_visits_project ON axp_bot_visits(project_id, created_at DESC);

-- AXP: Deploy configuration
CREATE TABLE IF NOT EXISTS axp_configs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  origin_url TEXT NOT NULL,
  deploy_type TEXT NOT NULL DEFAULT 'cloudflare',
  deploy_key TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id)
);
