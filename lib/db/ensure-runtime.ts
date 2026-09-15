// Guarantees the payout + realtime tables exist at runtime, independent of the
// (fragile) SQL migration script. Idempotent; safe to call on every process.
// Creates the tables added by migrations 040/041/042 so a fresh deploy/cold DB
// never 500s on routes that read/write them.
import type { DatabaseClient } from '@lp/db/factory'

let _ensured = false

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS vehicle_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trip_fare_usd REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS payout_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_reference TEXT NOT NULL,
    payee_type TEXT NOT NULL,
    payee_id INTEGER NOT NULL,
    amount_usd REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    earned_at TEXT NOT NULL,
    settlement_period TEXT NOT NULL,
    category_snapshot TEXT,
    requested_at TEXT,
    paid_at TEXT,
    method TEXT,
    writeoff_reason TEXT,
    refund_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_payout_ledger_unique
    ON payout_ledger(booking_reference, payee_type, payee_id)`,
  `CREATE INDEX IF NOT EXISTS idx_payout_ledger_payee
    ON payout_ledger(payee_type, payee_id, settlement_period)`,
  `CREATE TABLE IF NOT EXISTS payout_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payee_type TEXT NOT NULL,
    payee_id INTEGER NOT NULL,
    period TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    reviewed_by TEXT,
    paid_at TEXT,
    method TEXT,
    reference TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_req_unique_active
    ON payout_requests(payee_type, payee_id, period)
    WHERE status IN ('requested', 'paid')`,
  `CREATE TABLE IF NOT EXISTS refunds_disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_reference TEXT NOT NULL,
    provider_event_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    resolution TEXT,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS events_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    correlation_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
]

async function ensureColumns(db: DatabaseClient, columnSql: Array<{ table: string; add: string }>): Promise<void> {
  for (const c of columnSql) {
    try {
      await db.execute(`ALTER TABLE ${c.table} ADD COLUMN ${c.add}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!/duplicate column/i.test(msg)) throw err
    }
  }
}

/**
 * Idempotent runtime table guarantee for the payout + realtime schema.
 * Safe to call repeatedly; runs DDL once per process.
 */
export async function ensureRuntimeSchema(db: DatabaseClient): Promise<void> {
  if (_ensured) return
  for (const ddl of DDL) {
    await db.execute(ddl)
  }
  await ensureColumns(db, [
    { table: 'drivers', add: 'vehicle_category_id INTEGER' },
  ])
  _ensured = true
}