-- Service incidents table linked to booking orders
-- Tracks service novelties/incidents (flight delay, advance, cancel, schedule change)

CREATE TABLE IF NOT EXISTS service_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flight_delay', 'flight_advance', 'flight_cancel', 'schedule_change')),
  original_arrival_date TEXT,
  new_arrival_date TEXT,
  original_arrival_time TEXT,
  new_arrival_time TEXT,
  description TEXT,
  reported_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_incidents_order_id
  ON service_incidents(order_id);

CREATE INDEX IF NOT EXISTS idx_service_incidents_type
  ON service_incidents(type);
