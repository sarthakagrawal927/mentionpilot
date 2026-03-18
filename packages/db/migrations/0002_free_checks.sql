-- Free brand checks (no auth, rate limited by IP)
CREATE TABLE IF NOT EXISTS free_checks (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  brand_name TEXT,
  ip_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  mention_rate REAL,
  results TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_free_checks_ip ON free_checks(ip_address, created_at DESC);
