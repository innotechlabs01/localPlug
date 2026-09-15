-- Migration 040: Payout, settlement and refund/dispute ledger
-- Supports the marketplace split + manual settlement model (LocalPlug).
-- Driver paid weekly (per-trip fare by vehicle category), hotel paid monthly
-- (commission, released at check-in). Both collect via payout request; admin
-- consigns by transfer and confirms. Pre-milestone refunds cancel everything
-- with no liability; post-milestone refunds are written off with a record.

-- Vehicle categories (dynamic, admin-managed, no hardcoded enum)
CREATE TABLE IF NOT EXISTS vehicle_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trip_fare_usd REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payout ledger — one line per booking + beneficiary, snapshot at milestone
CREATE TABLE IF NOT EXISTS payout_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_reference TEXT NOT NULL,
  payee_type TEXT NOT NULL,                 -- 'driver' | 'hotel'
  payee_id INTEGER NOT NULL,                -- drivers.id | hotels.id
  amount_usd REAL NOT NULL,                 -- snapshot of fare/commission
  status TEXT NOT NULL DEFAULT 'available', -- available|requested|paid|written_off
  earned_at TEXT NOT NULL,                  -- milestone date (completed / check_in)
  settlement_period TEXT NOT NULL,          -- '2026-W38' | '2026-09'
  category_snapshot TEXT,                   -- driver category name at time of trip
  requested_at TEXT,
  paid_at TEXT,
  method TEXT,
  writeoff_reason TEXT,
  refund_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_payee
  ON payout_ledger(payee_type, payee_id, settlement_period);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_status ON payout_ledger(status);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_booking ON payout_ledger(booking_reference);

-- Payout requests — batch of ledger lines requested per period
CREATE TABLE IF NOT EXISTS payout_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payee_type TEXT NOT NULL,
  payee_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested', -- requested|approved|paid|cancelled
  reviewed_by TEXT,
  paid_at TEXT,
  method TEXT,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payout_requests_payee ON payout_requests(payee_type, payee_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- Refunds / disputes — registry for write-offs and metrics (idempotent by event)
CREATE TABLE IF NOT EXISTS refunds_disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_reference TEXT NOT NULL,
  provider_event_id TEXT NOT NULL UNIQUE,   -- idempotency
  type TEXT NOT NULL,                       -- 'refund'|'dispute'|'chargeback'
  amount_usd REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',      -- open|resolved
  resolution TEXT,                          -- 'pre_milestone'|'write_off'|'contested'
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_booking ON refunds_disputes(booking_reference);

-- Add payout wiring columns
ALTER TABLE drivers ADD COLUMN vehicle_category_id INTEGER;
ALTER TABLE hotels ADD COLUMN bank_account TEXT;

-- Seed nothing: vehicle categories are created/gmanaged by the admin.