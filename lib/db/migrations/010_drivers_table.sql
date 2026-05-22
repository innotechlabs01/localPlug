-- Migration: Create drivers table for dispatch center
-- Created: 2026-05-21

CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  email TEXT UNIQUE,
  vehicle TEXT NOT NULL,
  plate TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'available',
  rating REAL DEFAULT 5.0,
  languages TEXT DEFAULT 'Spanish',
  experience_level TEXT DEFAULT 'Standard',
  total_trips INTEGER DEFAULT 0,
  vip_compatible INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_category ON drivers(category);
