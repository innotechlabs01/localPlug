-- lib/db/migrations/022_conversation_response_time.sql
-- Migration: Add first_agent_response_at to conversations for response time tracking
-- Created: 2026-05-31

ALTER TABLE conversations ADD COLUMN first_agent_response_at TEXT DEFAULT NULL;
