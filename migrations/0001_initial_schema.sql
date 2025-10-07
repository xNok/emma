-- Initial schema for Emma forms system
-- Database: Cloudflare D1 (SQLite)
-- Version: 1
-- Created: 2025-10-07

-- Forms table: metadata about each form
CREATE TABLE forms (
  id TEXT PRIMARY KEY,                    -- e.g., "contact-form-001"
  name TEXT NOT NULL,                     -- Human-readable name
  schema TEXT NOT NULL,                   -- JSON schema definition
  version TEXT NOT NULL,                  -- Schema version "1.0.0"
  api_endpoint TEXT,                      -- Custom API endpoint if any
  created_at INTEGER NOT NULL,            -- Unix timestamp
  updated_at INTEGER NOT NULL,            -- Unix timestamp
  active INTEGER DEFAULT 1,               -- Soft delete flag
  deploy_count INTEGER DEFAULT 0,         -- Number of deployments
  submission_count INTEGER DEFAULT 0      -- Cached submission count
);

-- Submissions table: actual form submissions
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,                    -- e.g., "sub_abc123xyz"
  form_id TEXT NOT NULL,                  -- Foreign key to forms.id
  data TEXT NOT NULL,                     -- JSON of submitted data
  meta TEXT,                              -- JSON metadata (IP, UA, referrer)
  spam_score INTEGER DEFAULT 0,           -- Spam detection score
  status TEXT DEFAULT 'new',              -- new, read, archived, spam
  created_at INTEGER NOT NULL,            -- Unix timestamp
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_submissions_form_id ON submissions(form_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_forms_active ON forms(active);

-- Metadata table: for system configuration
CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert initial metadata
INSERT INTO metadata (key, value, updated_at) VALUES 
  ('schema_version', '1', strftime('%s', 'now')),
  ('created_at', strftime('%s', 'now'), strftime('%s', 'now'));
