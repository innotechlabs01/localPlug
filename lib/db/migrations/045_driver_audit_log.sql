-- Migration 045: Driver assignment audit log (append-only, immutable).
-- Tracks every state change on assignments so admin/dispatch can verify
-- that no service is lost and every driver action is audited.
CREATE TABLE IF NOT EXISTS driver_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  actor_type TEXT NOT NULL,            -- 'driver' | 'admin' | 'dispatch' | 'system'
  actor_id INTEGER,                    -- clerk_user_id or driver id
  actor_name TEXT,
  action TEXT NOT NULL,                -- 'offered' | 'accepted' | 'declined' | 'en_route' | 'pickedup' | 'completed' | 'cancelled' | 'reschedule_requested'
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  metadata TEXT,                       -- JSON with extra context (parking proof url, etc.)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_driver_audit_assignment ON driver_audit_log(assignment_id);
CREATE INDEX IF NOT EXISTS idx_driver_audit_order ON driver_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_audit_driver ON driver_audit_log(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_audit_created ON driver_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_audit_action ON driver_audit_log(action);
