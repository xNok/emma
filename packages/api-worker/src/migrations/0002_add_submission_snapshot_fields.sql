-- Add snapshot tracking to submissions table
-- This migration adds fields to track which form snapshot was used for each submission
-- Database: Cloudflare D1 (SQLite)
-- Version: 2
-- Created: 2025-10-18

-- Note: SQLite does not support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- The api-worker.ts deployment script handles "duplicate column name" errors
-- by catching and ignoring them, making this migration idempotent

-- Add form_snapshot and form_bundle columns to submissions table
ALTER TABLE submissions ADD COLUMN form_snapshot INTEGER;
ALTER TABLE submissions ADD COLUMN form_bundle TEXT;

-- Create index for querying submissions by snapshot
CREATE INDEX IF NOT EXISTS idx_submissions_form_snapshot ON submissions(form_snapshot);
