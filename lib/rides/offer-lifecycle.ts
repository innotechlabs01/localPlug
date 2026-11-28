import type { DatabaseClient } from '@lp/db/factory'
import { getDb } from '@/lib/db'
import { refundPaidRide } from '@/lib/rides/refund'

/** A driver has 30 seconds to accept an on-demand offer before it is expired. */
export const OFFER_TTL_SECONDS = 30
/** After three unanswered offers (~90s) the ride is cancelled automatically. */
export const RIDE_CANCEL_AFTER_SECONDS = 90

const ACTIVE_ASSIGNMENT_STATUSES = ['accepted', 'confirmed_to_client', 'en_route', 'in_progress']
const OFFER_STATUSES = ['pending_acceptance', 'offered']
const CLOSED_STATUSES = ['cancelled', 'completed']

let schemaPromise: Promise<void> | null = null

/**
 * `driver_locations` is created lazily by the GPS/panic routes only, never by a
 * migration. Dispatch queries LEFT JOIN it, so a cold database 500s. Create it
 * once per process before any dispatch query runs.
 */
export async function ensureRideDispatchSchema(db: DatabaseClient = getDb()): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = db
      .execute({
        sql: `CREATE TABLE IF NOT EXISTS driver_locations (
                driver_id INTEGER PRIMARY KEY,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                heading REAL,
                speed REAL,
                accuracy REAL,
                order_id INTEGER,
                gps_consent INTEGER DEFAULT 1,
                updated_at TEXT DEFAULT (datetime('now'))
              )`,
        args: [],
      })
      .then(() => undefined)
      .catch(err => {
        schemaPromise = null
        throw err
      })
  }
  return schemaPromise
}

export type OfferState = {
  status?: unknown
  created_at?: unknown
  order_status?: unknown
  dispatch_status?: unknown
  assigned_to?: unknown
  driver_id?: unknown
  booking_reference?: unknown
  package_id?: unknown
  observations?: unknown
  payment_status?: unknown
}

function ageSeconds(value: unknown, now: number): number | null {
  if (!value) return null
  const raw = String(value)
  // SQLite datetime('now') has no timezone suffix; ISO strings already have one.
  const iso = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`
  const createdAt = new Date(iso).getTime()
  if (!Number.isFinite(createdAt)) return null
  return Math.max(0, Math.floor((now - createdAt) / 1000))
}

/**
 * An offer is only actionable while the order is open, paid, still unassigned to
 * another driver, and (for on-demand rides) inside the 30s acceptance window.
 */
export function isStaleOffer(offer: OfferState, now: number = Date.now()): boolean {
  if (!OFFER_STATUSES.includes(String(offer.status))) return true
  if (CLOSED_STATUSES.includes(String(offer.order_status))) return true
  if (CLOSED_STATUSES.includes(String(offer.dispatch_status))) return true
  if (String(offer.booking_reference || '').startsWith('RIDE-') && String(offer.payment_status) !== 'paid') return true

  const assignedTo = offer.assigned_to == null ? null : Number(offer.assigned_to)
  const driverId = offer.driver_id == null ? null : Number(offer.driver_id)
  if (assignedTo != null && driverId != null && assignedTo !== driverId) return true

  const isOnDemand =
    String(offer.booking_reference || '').startsWith('RIDE-') ||
    String(offer.package_id || '').startsWith('on_demand_') ||
    String(offer.observations || '').startsWith('ON-DEMAND')
  if (!isOnDemand) return false

  const age = ageSeconds(offer.created_at, now)
  return age == null || age >= OFFER_TTL_SECONDS
}

/**
 * Cancel on-demand rides nobody accepted and refund the captured amount.
 * Runs from request/status/driver-assignment paths, so no background worker is
 * required. Unpaid abandoned checkouts are cancelled without calling Polar.
 */
export async function sweepStaleRideOffers(db: DatabaseClient = getDb()): Promise<void> {
  const unfinishedGuard = `NOT EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.order_id = o.id
      AND a.status IN (${ACTIVE_ASSIGNMENT_STATUSES.map(() => '?').join(', ')})
  )`
  const activeStatusesArgs = [...ACTIVE_ASSIGNMENT_STATUSES]

  const unpaidOrders = await db.execute({
    sql: `SELECT o.id
          FROM orders o
          WHERE o.booking_reference LIKE 'RIDE-%'
            AND o.status = 'awaiting_payment'
            AND o.updated_at <= datetime('now', '-90 seconds')
            AND ${unfinishedGuard}
          ORDER BY o.id`,
    args: activeStatusesArgs,
  })
  const unpaidIds = unpaidOrders.rows.map(row => Number(row.id)).filter(id => Number.isFinite(id))
  if (unpaidIds.length > 0) {
    await db.execute({
      sql: `UPDATE orders
            SET status = 'cancelled', dispatch_status = 'cancelled', payment_status = 'failed', updated_at = datetime('now')
            WHERE id IN (${unpaidIds.map(() => '?').join(', ')}) AND status = 'awaiting_payment'`,
      args: unpaidIds,
    })
  }

  const paidOrders = await db.execute({
    sql: `SELECT o.id, o.booking_reference
          FROM orders o
          WHERE o.booking_reference LIKE 'RIDE-%'
            AND o.payment_status = 'paid'
            AND o.assigned_to IS NULL
            AND o.updated_at <= datetime('now', '-90 seconds')
            AND (
              o.status IN ('searching', 'on_demand', 'new', 'pending')
              OR (o.status = 'cancelled' AND o.dispatch_status = 'cancelled')
            )
            AND ${unfinishedGuard}
          ORDER BY o.id`,
    args: activeStatusesArgs,
  })

  const paidRows = paidOrders.rows as Array<Record<string, unknown>>
  const refundedIds: number[] = []
  for (const row of paidRows) {
    const id = Number(row.id)
    if (!Number.isFinite(id)) continue
    const outcome = await refundPaidRide(db, { bookingReference: String(row.booking_reference) })
    if (outcome.ok) refundedIds.push(id)
  }

  const paidIds = paidRows.map(row => Number(row.id)).filter(id => Number.isFinite(id))
  if (paidIds.length > 0) {
    const refundedCase = refundedIds.length > 0
      ? `CASE WHEN id IN (${refundedIds.map(() => '?').join(', ')}) THEN 'refunded' ELSE payment_status END`
      : 'payment_status'
    await db.execute({
      sql: `UPDATE orders
            SET status = 'cancelled',
                dispatch_status = 'cancelled',
                payment_status = ${refundedCase},
                updated_at = datetime('now')
            WHERE id IN (${paidIds.map(() => '?').join(', ')})
              AND payment_status = 'paid'`,
      args: [...refundedIds, ...paidIds],
    })

    const refundedReferences = paidRows
      .filter(row => refundedIds.includes(Number(row.id)))
      .map(row => String(row.booking_reference))
      .filter(Boolean)
    if (refundedReferences.length > 0) {
      await db.execute({
        sql: `UPDATE payments
              SET status = 'refunded', updated_at = datetime('now')
              WHERE booking_reference IN (${refundedReferences.map(() => '?').join(', ')})`,
        args: refundedReferences,
      })
    }
  }

  const staleOffers = await db.execute({
    sql: `SELECT a.id
          FROM assignments a
          JOIN orders o ON a.order_id = o.id
          WHERE a.status IN ('pending_acceptance', 'offered')
            AND a.created_at <= datetime('now', '-30 seconds')
            AND (o.status IN ('cancelled', 'completed') OR o.dispatch_status IN ('cancelled', 'completed'))`,
    args: [],
  })

  const offerIds = staleOffers.rows.map(row => Number(row.id)).filter(id => Number.isFinite(id))
  if (offerIds.length > 0) {
    await db.execute({
      sql: `UPDATE assignments
            SET status = 'expired', updated_at = datetime('now')
            WHERE id IN (${offerIds.map(() => '?').join(', ')})`,
      args: offerIds,
    })
  }
}
