-- Migration 042: Append-only domain event outbox for realtime sync.
-- Every key state mutation appends an event here (same DB write, no extra infra).
-- Frontends consume via GET /api/events?since=<id> (cursor polling) or the
-- SSE stream /api/events/stream. Dedicated event tables already exist in the SDD
-- scaffold (packages/types + packages/events); this table is the persistent bus.
CREATE TABLE IF NOT EXISTS events_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,          -- 'booking.created' | 'payment.completed' | ...
  payload TEXT NOT NULL,       -- JSON
  correlation_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_outbox_id ON events_outbox(id);
CREATE INDEX IF NOT EXISTS idx_events_outbox_type ON events_outbox(type);