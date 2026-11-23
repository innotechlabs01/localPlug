-- Migration: Add Clerk user sync and employee documents
-- Created: 2026-05-21
-- Feature: admin-dispatch-phase (Clerk auth)

-- Add Clerk ID to users table
ALTER TABLE users ADD COLUMN clerk_id TEXT;

-- Add role_id to users table for direct role assignment
ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);

-- Employee documents tracking
CREATE TABLE IF NOT EXISTS employee_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  document_type TEXT NOT NULL, -- license, soat, technical_inspection, background_check
  document_number TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'valid', -- valid, expiring, expired, pending
  file_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Employee activity log
CREATE TABLE IF NOT EXISTS employee_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- trip_completed, document_updated, status_changed, etc.
  description TEXT,
  metadata TEXT, -- JSON for additional data
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_user_id ON employee_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON employee_documents(status);
CREATE INDEX IF NOT EXISTS idx_employee_activity_user_id ON employee_activity(user_id);

-- Add driver-specific columns to users
ALTER TABLE users ADD COLUMN vehicle_info TEXT;
ALTER TABLE users ADD COLUMN license_number TEXT;
ALTER TABLE users ADD COLUMN vehicle_plate TEXT;
ALTER TABLE users ADD COLUMN employee_status TEXT DEFAULT 'active'; -- active, inactive, on_route
ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending'; -- verified, pending, needs_review
ALTER TABLE users ADD COLUMN rating REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN total_trips INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_revenue REAL DEFAULT 0;
