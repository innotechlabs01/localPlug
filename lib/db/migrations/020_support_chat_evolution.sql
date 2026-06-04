-- Migration: Support chat evolution
-- Adds user phone/country columns to conversations
-- Creates conversation_ratings table for collecting user feedback

ALTER TABLE conversations ADD COLUMN user_phone TEXT;
ALTER TABLE conversations ADD COLUMN user_country TEXT;
ALTER TABLE conversations ADD COLUMN country_code TEXT;

CREATE TABLE IF NOT EXISTS conversation_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversation_ratings_conversation_id ON conversation_ratings(conversation_id);
