-- Event-Driven Outbox & Idempotency tables

CREATE TABLE IF NOT EXISTS processed_events (
  event_id INTEGER NOT NULL,
  consumer_name TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, consumer_name)
);

CREATE INDEX IF NOT EXISTS idx_processed_events_at
  ON processed_events(processed_at);

-- Note: events_outbox.locked_at is added safely via ensure-runtime.ts / migrate
CREATE INDEX IF NOT EXISTS idx_events_outbox_delivery
  ON events_outbox(status, retry_count, id);
