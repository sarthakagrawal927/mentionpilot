-- API keys for programmatic access (P8.2).
-- Users can create multiple keys; each is a bearer token callers put in
-- Authorization: Bearer mp_live_<raw>. Only the SHA-256 hash is stored.
-- key_prefix is the first 11 chars (mp_live_abc) shown in listings so users
-- can tell their keys apart without revealing the secret.

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '["read"]',
  last_used_at TEXT,
  expires_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
