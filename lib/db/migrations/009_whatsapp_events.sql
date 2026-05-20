-- Migration: WhatsApp Evolution API events tracking
-- Created: 2026-05-19
-- Feature: 009-whatsapp-evolution-api

-- Add WhatsApp-specific columns to conversations
ALTER TABLE conversations ADD COLUMN whatsapp_instance TEXT;
ALTER TABLE conversations ADD COLUMN whatsapp_message_id TEXT;

-- Track all WhatsApp events from Evolution API
CREATE TABLE IF NOT EXISTS whatsapp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  event_type TEXT NOT NULL,        -- message.upsert, message-receipt.update, instance.status, connection.update
  instance_name TEXT NOT NULL,     -- Evolution API instance name (e.g. localplug-main)
  remote_jid TEXT NOT NULL,        -- Phone number in JID format
  message_id TEXT,                 -- WhatsApp message ID
  from_me INTEGER NOT NULL DEFAULT 0, -- 1 if sent by us, 0 if received
  content TEXT,                    -- Message text content
  message_type TEXT,               -- conversation, image, video, etc.
  status TEXT,                     -- delivered, read, pending, played
  participant TEXT,                -- Group participant if applicable
  raw_payload TEXT,                -- Full JSON payload from Evolution API
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for whatsapp_events
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_conversation_id ON whatsapp_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_remote_jid ON whatsapp_events(remote_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_event_type ON whatsapp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_instance ON whatsapp_events(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_created_at ON whatsapp_events(created_at);

-- Index for conversations by WhatsApp instance
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_instance ON conversations(whatsapp_instance);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
