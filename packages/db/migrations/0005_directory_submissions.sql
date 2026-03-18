-- Track which directories a user has submitted to
CREATE TABLE IF NOT EXISTS directory_submissions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  directory_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TEXT,
  notes TEXT,
  listing_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(project_id, directory_slug)
);

CREATE INDEX IF NOT EXISTS idx_directory_submissions_project ON directory_submissions(project_id);
