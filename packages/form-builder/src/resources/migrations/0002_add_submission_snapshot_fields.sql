-- Add snapshot tracking to submissions table
-- This migration adds fields to track which form snapshot was used for each submission
-- Database: Cloudflare D1 (SQLite)
-- Version: 2
-- Created: 2025-10-18

-- Add form_snapshot and form_bundle columns to submissions table
ALTER TABLE submissions ADD COLUMN form_snapshot INTEGER;
ALTER TABLE submissions ADD COLUMN form_bundle TEXT;

-- Create index for querying submissions by snapshot
CREATE INDEX idx_submissions_form_snapshot ON submissions(form_snapshot);
