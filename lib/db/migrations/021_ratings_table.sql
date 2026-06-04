-- lib/db/migrations/021_ratings_table.sql
-- Migration: Create ratings table for customer testimonials
-- Created: 2026-05-31

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL UNIQUE,
  customer_name VARCHAR(150) NOT NULL,
  customer_country VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  resolved INTEGER DEFAULT 1,
  first_response_time_ms INTEGER DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX idx_ratings_rating ON ratings(rating);
CREATE INDEX idx_ratings_conversation_id ON ratings(conversation_id);
