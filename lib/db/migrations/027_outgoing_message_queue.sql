-- Migration: Outgoing message queue for WhatsApp/n8n delivery resilience
-- Enables queuing, retry with backoff, and reconnection handling

CREATE TABLE IF NOT EXISTS outgoing_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  recipient TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  metadata TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outgoing_messages_status_next ON outgoing_messages(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_outgoing_messages_channel ON outgoing_messages(channel);
CREATE INDEX IF NOT EXISTS idx_outgoing_messages_recipient ON outgoing_messages(recipient);
