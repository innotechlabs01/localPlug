-- Migration 046: Hotel audit log (append-only, immutable).
-- Tracks every state change on hotel room assignments so admin/dispatch can verify
-- that no service is lost and every hotel action is audited.
CREATE TABLE IF NOT EXISTS hotel_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  hotel_id INTEGER NOT NULL,
  room_id INTEGER,
  actor_type TEXT NOT NULL,            -- 'hotel' | 'admin' | 'dispatch' | 'system'
  actor_id INTEGER,
  actor_name TEXT,
  action TEXT NOT NULL,                -- 'accept_room' | 'decline_room' | 'check_in' | 'check_out' | 'reschedule_requested' | 'cancelled' | 'room_ready'
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  metadata TEXT,                       -- JSON with extra context (new dates, room change, etc.)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hotel_audit_order ON hotel_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_hotel_audit_hotel ON hotel_audit_log(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_audit_room ON hotel_audit_log(room_id);
CREATE INDEX IF NOT EXISTS idx_hotel_audit_created ON hotel_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_hotel_audit_action ON hotel_audit_log(action);
EOF
echo "migracion hotel auditoría creada"