// Payout / settlement / refund dispute ledger — the money backbone for LocalPlug.
// Split-payment marketplace model:
//   - Driver paid weekly, earning = per-trip fare by vehicle category (snapshot).
//   - Hotel paid monthly, earning = commission on package price, released at check-in.
//   - Both collect via a payout request; admin consigns by transfer and confirms.
//   - Pre-milestone refunds cancel everything (no liability).
//   - Post-milestone refunds are written off with a record.
import { getDb } from '@/lib/db'
import { getHotelCommissionRate } from '@/lib/settings'
import { emitEvent } from '@/lib/events-outbox'

// ─── Vehicle categories (admin-managed params) ───────────────────────────────

export interface VehicleCategory {
  id: number
  name: string
  trip_fare_usd: number
  is_active: number
  sort_order: number
}

export async function listVehicleCategories(includeInactive = false): Promise<VehicleCategory[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, name, trip_fare_usd, is_active, sort_order
          FROM vehicle_categories
          ${includeInactive ? '' : 'WHERE is_active = 1'}
          ORDER BY sort_order ASC, name ASC`,
    args: [],
  })
  return result.rows as unknown as VehicleCategory[]
}

export async function getVehicleCategory(id: number): Promise<VehicleCategory | null> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, name, trip_fare_usd, is_active, sort_order
          FROM vehicle_categories WHERE id = ?`,
    args: [id],
  })
  return (result.rows[0] as unknown as VehicleCategory) || null
}

export async function createVehicleCategory(data: {
  name: string
  trip_fare_usd: number
  sort_order?: number
}): Promise<VehicleCategory> {
  const db = getDb()
  const result = await db.execute({
    sql: `INSERT INTO vehicle_categories (name, trip_fare_usd, sort_order)
          VALUES (?, ?, ?)`,
    args: [data.name, data.trip_fare_usd, data.sort_order ?? 0],
  })
  const created = await getVehicleCategory(Number(result.lastInsertRowid))
  return created!
}

export async function updateVehicleCategory(
  id: number,
  data: Partial<Pick<VehicleCategory, 'name' | 'trip_fare_usd' | 'is_active' | 'sort_order'>>,
): Promise<VehicleCategory | null> {
  const db = getDb()
  const sets: string[] = []
  const args: (string | number)[] = []
  const allowed: Record<string, unknown> = data
  for (const col of ['name', 'trip_fare_usd', 'is_active', 'sort_order'] as const) {
    if (allowed[col] !== undefined) {
      sets.push(`${col} = ?`)
      args.push(allowed[col] as string | number)
    }
  }
  if (sets.length === 0) return getVehicleCategory(id)
  sets.push(`updated_at = datetime('now')`)
  args.push(id)
  await db.execute({
    sql: `UPDATE vehicle_categories SET ${sets.join(', ')} WHERE id = ?`,
    args,
  })
  return getVehicleCategory(id)
}

/** Fare a driver earns per trip, from their vehicle category. Null if unset/inactive. */
export async function getDriverCategoryFare(driverId: number): Promise<number | null> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT vc.trip_fare_usd FROM drivers d
          JOIN vehicle_categories vc ON vc.id = d.vehicle_category_id
          WHERE d.id = ? AND vc.is_active = 1`,
    args: [driverId],
  })
  const fare = Number(result.rows[0]?.trip_fare_usd)
  return Number.isFinite(fare) && fare > 0 ? Math.round(fare * 100) / 100 : null
}

// ─── Settlement period helpers ───────────────────────────────────────────────

function weeklyPeriod(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  // Monday-based ISO-like week
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function monthlyPeriod(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// ─── Accrual (milestones) ────────────────────────────────────────────────────

/** Driver accrues a payout line the moment a trip reaches `completed`. */
export async function accrueDriverPayout(orderId: number, driverId: number): Promise<void> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT o.booking_reference, d.vehicle_category_id, vc.name AS cat_name, vc.trip_fare_usd
          FROM orders o
          JOIN assignments a ON a.order_id = o.id AND a.driver_id = ? AND a.status = 'completed'
          JOIN drivers d ON d.id = ?
          LEFT JOIN vehicle_categories vc ON vc.id = d.vehicle_category_id
          WHERE o.id = ? LIMIT 1`,
    args: [driverId, driverId, orderId],
  })
  const row = res.rows[0]
  const bookingReference = row?.booking_reference as string | undefined
  const fare = Number(row?.trip_fare_usd)
  if (!bookingReference || !Number.isFinite(fare) || fare <= 0) {
    // No category fare configured — skip accrual (admin hasn't set up categories yet).
    return
  }
  await db.execute({
    sql: `INSERT OR IGNORE INTO payout_ledger
      (booking_reference, payee_type, payee_id, amount_usd, status, earned_at, settlement_period, category_snapshot)
      VALUES (?, 'driver', ?, ?, 'available', datetime('now'), ?, ?)`,
    args: [
      bookingReference,
      driverId,
      fare,
      weeklyPeriod(new Date()),
      (row?.cat_name as string | null) || null,
    ],
  })
}

/** Hotel accrues a payout line the moment a reservation reaches check-in. */
export async function accrueHotelPayout(orderId: number, hotelId: number): Promise<void> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT o.booking_reference, o.package_price,
                 COALESCE(NULLIF(o.hotel_commission_rate, 0), ?) AS rate
          FROM orders o WHERE o.id = ? LIMIT 1`,
    args: [Number(await getHotelCommissionRate()), orderId],
  })
  const row = res.rows[0]
  const bookingReference = row?.booking_reference as string | undefined
  const price = Number(row?.package_price) || 0
  const rate = Number(row?.rate) || 0
  if (!bookingReference || price <= 0 || rate <= 0) return
  const amount = Math.round(price * rate * 100) / 100

  await db.execute({
    sql: `INSERT OR IGNORE INTO payout_ledger
      (booking_reference, payee_type, payee_id, amount_usd, status, earned_at, settlement_period)
      VALUES (?, 'hotel', ?, ?, 'available', datetime('now'), ?)`,
    args: [bookingReference, hotelId, amount, monthlyPeriod(new Date())],
  })
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getDriverPayable(id: number): Promise<{ balance_usd: number; pending_usd: number }> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT
            COALESCE(SUM(CASE WHEN status = 'available' THEN amount_usd ELSE 0 END), 0) AS balance,
            COALESCE(SUM(CASE WHEN status IN ('requested','paid') THEN amount_usd ELSE 0 END), 0) AS pending
          FROM payout_ledger WHERE payee_type = 'driver' AND payee_id = ? AND status != 'written_off'`,
    args: [id],
  })
  return {
    balance_usd: Math.round(Number(res.rows[0]?.balance || 0) * 100) / 100,
    pending_usd: Math.round(Number(res.rows[0]?.pending || 0) * 100) / 100,
  }
}

export async function getHotelPayable(id: number): Promise<{ balance_usd: number; pending_usd: number }> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT
            COALESCE(SUM(CASE WHEN status = 'available' THEN amount_usd ELSE 0 END), 0) AS balance,
            COALESCE(SUM(CASE WHEN status IN ('requested','paid') THEN amount_usd ELSE 0 END), 0) AS pending
          FROM payout_ledger WHERE payee_type = 'hotel' AND payee_id = ? AND status != 'written_off'`,
    args: [id],
  })
  return {
    balance_usd: Math.round(Number(res.rows[0]?.balance || 0) * 100) / 100,
    pending_usd: Math.round(Number(res.rows[0]?.pending || 0) * 100) / 100,
  }
}

export async function listLedgerByPeriod(payeeType: string, period: string): Promise<
  Array<{
    id: number; booking_reference: string; amount_usd: number; status: string
    earned_at: string; category_snapshot: string | null
  }>
> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT id, booking_reference, amount_usd, status, earned_at, category_snapshot
          FROM payout_ledger
          WHERE payee_type = ? AND settlement_period = ?
          ORDER BY earned_at ASC`,
    args: [payeeType, period],
  })
  return res.rows as unknown as Array<{
    id: number; booking_reference: string; amount_usd: number; status: string
    earned_at: string; category_snapshot: string | null
  }>
}

// ─── Payout requests ─────────────────────────────────────────────────────────

export async function createPayoutRequest(
  payeeType: 'driver' | 'hotel',
  payeeId: number,
  period: string,
): Promise<{ requestId: number; amount_usd: number } | { error: string }> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT id, amount_usd FROM payout_ledger
          WHERE payee_type = ? AND payee_id = ? AND settlement_period = ? AND status = 'available'`,
    args: [payeeType, payeeId, period],
  })
  const lines = (res.rows || []) as unknown as Array<{ id: number; amount_usd: number }>
  if (lines.length === 0) return { error: 'Nothing available to request for this period' }

  const amount = Math.round(lines.reduce((s, l) => s + Number(l.amount_usd || 0), 0) * 100) / 100

  const ids = lines.map(l => l.id)
  const placeholders = ids.map(() => '?').join(',')

  // Atomic: create the request AND mark the ledger lines requested together, so
  // a partially-applied request can never desync (request paid but ledger available).
  // A partial unique index blocks a second active request per (payee, period).
  let requestId: number
  try {
    const batchRes = await db.batch([
      { sql: `INSERT INTO payout_requests (payee_type, payee_id, period, amount_usd) VALUES (?, ?, ?, ?)`, args: [payeeType, payeeId, period, amount] },
      { sql: `UPDATE payout_ledger SET status = 'requested', requested_at = datetime('now'), updated_at = datetime('now') WHERE id IN (${placeholders})`, args: ids },
    ])
    requestId = Number(batchRes[0].lastInsertRowid)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/UNIQUE constraint/i.test(msg)) return { error: 'Ya existe una solicitud activa para este periodo' }
    throw err
  }

  emitEvent('payout.requested', { payee_type: payeeType, payee_id: payeeId, amount_usd: amount }, { correlationId: String(requestId) }).catch(() => {})

  return { requestId, amount_usd: amount }
}

export interface PayoutRequestRow {
  id: number
  payee_type: string
  payee_id: number
  payee_name: string | null
  period: string
  amount_usd: number
  status: string
  reviewed_by: string | null
  paid_at: string | null
  method: string | null
  reference: string | null
  created_at: string
}

export async function listPayoutRequests(opts: {
  status?: string
  payee_type?: string
} = {}): Promise<PayoutRequestRow[]> {
  const db = getDb()
  const where: string[] = []
  const args: (string | number)[] = []
  if (opts.status) {
    where.push('pr.status = ?')
    args.push(opts.status)
  }
  if (opts.payee_type) {
    where.push('pr.payee_type = ?')
    args.push(opts.payee_type)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const res = await db.execute({
    sql: `SELECT pr.*,
            CASE pr.payee_type
              WHEN 'driver' THEN (SELECT name FROM drivers WHERE id = pr.payee_id)
              WHEN 'hotel'  THEN (SELECT name FROM hotels  WHERE id = pr.payee_id)
            END AS payee_name
          FROM payout_requests pr
          ${whereSql}
          ORDER BY pr.created_at DESC`,
    args,
  })
  return res.rows as unknown as PayoutRequestRow[]
}

/** Admin consigns a transfer for a request and marks its ledger lines paid. */
export async function settlePayoutRequest(
  requestId: number,
  method: string,
  reference: string,
  actor: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb()
  const req = await db.execute({
    sql: `SELECT * FROM payout_requests WHERE id = ?`,
    args: [requestId],
  })
  const request = req.rows[0]
  if (!request) return { ok: false, error: 'Request not found' }
  if (request.status === 'paid') return { ok: false, error: 'Request already paid' }

  await db.batch([
    {
      sql: `UPDATE payout_requests SET status = 'paid', paid_at = datetime('now'), method = ?, reference = ?, reviewed_by = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [method, reference, actor, requestId],
    },
    {
      sql: `UPDATE payout_ledger SET status = 'paid', paid_at = datetime('now'), method = ?, updated_at = datetime('now')
            WHERE payee_type = ? AND payee_id = ? AND settlement_period = ? AND status = 'requested'`,
      args: [method, request.payee_type, request.payee_id, request.period],
    },
  ])

  emitEvent('payout.settled', {
    payee_type: request.payee_type,
    payee_id: request.payee_id,
    amount_usd: Number(request.amount_usd),
    period: request.period,
  }, { correlationId: String(requestId) }).catch(() => {})

  return { ok: true }
}

export async function cancelPayoutRequest(requestId: number): Promise<{ ok: boolean; error?: string }> {
  const db = getDb()
  const req = await db.execute({ sql: `SELECT * FROM payout_requests WHERE id = ?`, args: [requestId] })
  const request = req.rows[0]
  if (!request) return { ok: false, error: 'Request not found' }
  if (request.status === 'paid') return { ok: false, error: 'Cannot cancel a paid request' }
  await db.batch([
    { sql: `UPDATE payout_requests SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`, args: [requestId] },
    { sql: `UPDATE payout_ledger SET status = 'available', requested_at = NULL, updated_at = datetime('now')
            WHERE payee_type = ? AND payee_id = ? AND settlement_period = ? AND status = 'requested'`,
      args: [request.payee_type, request.payee_id, request.period] },
  ])
  return { ok: true }
}

// ─── Refunds / disputes ──────────────────────────────────────────────────────
export type RefundResolution = 'pre_milestone' | 'write_off'

export interface RefundOutcome {
  resolution: RefundResolution
  duplicate: boolean
}

/**
 * Process a Polar refund/dispute for a booking.
 *  - Pre-milestone  → no liability exists; caller cancels associated services.
 *  - Post-milestone → write off the accrued payout lines (platform absorbs), with record.
 * Always marks the payment refunded and records the refund (idempotent by event id).
 */
export async function processBookingRefund(args: {
  bookingReference: string
  providerEventId: string
  amountUsd: number
  reason?: string
}): Promise<RefundOutcome> {
  const db = getDb()

  const existing = await db.execute({
    sql: `SELECT resolution, status FROM refunds_disputes WHERE provider_event_id = ?`,
    args: [args.providerEventId],
  })
  if (existing.rows.length) {
    return {
      resolution: (existing.rows[0].resolution as RefundResolution) || 'pre_milestone',
      duplicate: true,
    }
  }

  await db.execute({
    sql: `UPDATE payments SET status = 'refunded', updated_at = datetime('now')
          WHERE booking_reference = ? AND status = 'completed'`,
    args: [args.bookingReference],
  })

  const lines = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM payout_ledger WHERE booking_reference = ? AND status != 'written_off'`,
    args: [args.bookingReference],
  })
  const reached = Number(lines.rows[0]?.c || 0) > 0

  if (reached) {
    await db.execute({
      sql: `UPDATE payout_ledger SET status = 'written_off', writeoff_reason = ?, updated_at = datetime('now')
            WHERE booking_reference = ? AND status IN ('available', 'requested')`,
      args: [args.reason || 'refund/dispute after milestone', args.bookingReference],
    })
    await db.execute({
      sql: `INSERT INTO refunds_disputes (booking_reference, provider_event_id, type, amount_usd, status, resolution, reason)
            VALUES (?, ?, 'refund', ?, 'resolved', 'write_off', ?)`,
      args: [args.bookingReference, args.providerEventId, args.amountUsd, args.reason || null],
    })
    return { resolution: 'write_off', duplicate: false }
  }

  await db.execute({
    sql: `INSERT INTO refunds_disputes (booking_reference, provider_event_id, type, amount_usd, status, resolution, reason)
          VALUES (?, ?, 'refund', ?, 'resolved', 'pre_milestone', ?)`,
    args: [args.bookingReference, args.providerEventId, args.amountUsd, args.reason || null],
  })
  return { resolution: 'pre_milestone', duplicate: false }
}
// ─── Statement (state of account) per period ────────────────────────────────

export interface PayoutStatementLine {
  booking_reference: string
  amount_usd: number
  status: string
  earned_at: string
  category_snapshot: string | null
}

export interface PayoutStatement {
  period: string
  lines: PayoutStatementLine[]
  total: number
  requested: number
  paid: number
  written_off: number
}

/** Full line detail for a beneficiary + period (driver weekly, hotel monthly). */
export async function getPayoutStatement(
  payeeType: 'driver' | 'hotel',
  payeeId: number,
  period: string,
): Promise<PayoutStatement> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT booking_reference, amount_usd, status, earned_at, category_snapshot
          FROM payout_ledger
          WHERE payee_type = ? AND payee_id = ? AND settlement_period = ?
          ORDER BY earned_at ASC`,
    args: [payeeType, payeeId, period],
  })
  const lines = (res.rows || []) as unknown as Array<{
    booking_reference: string
    amount_usd: number
    status: string
    earned_at: string
    category_snapshot: string | null
  }>
  const total = Math.round(lines.reduce((s, l) => s + Number(l.amount_usd || 0), 0) * 100) / 100
  const sum = (s: string) =>
    Math.round(lines.filter(l => l.status === s).reduce((a, l) => a + Number(l.amount_usd || 0), 0) * 100) / 100
  return {
    period,
    lines: lines.map(l => ({
      booking_reference: l.booking_reference,
      amount_usd: Number(l.amount_usd || 0),
      status: l.status,
      earned_at: l.earned_at,
      category_snapshot: l.category_snapshot,
    })),
    total,
    requested: sum('requested'),
    paid: sum('paid'),
    written_off: sum('written_off'),
  }
}

/** CSV export for a statement (downloadable state of account). */
export function statementToCsv(stmt: PayoutStatement): string {
  const header = 'booking_reference,amount_usd,status,earned_at,category'
  const rows = stmt.lines.map(l =>
    [l.booking_reference, l.amount_usd.toFixed(2), l.status, l.earned_at, l.category_snapshot || '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  )
  return [header, ...rows, `"TOTAL",${stmt.total.toFixed(2)},,,`].join('\n')
}

/** Distinct settlement periods a beneficiary has ledger activity in (newest first). */
export async function listPayoutPeriods(payeeType: 'driver' | 'hotel', payeeId: number): Promise<string[]> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT DISTINCT settlement_period FROM payout_ledger
          WHERE payee_type = ? AND payee_id = ?
          ORDER BY settlement_period DESC`,
    args: [payeeType, payeeId],
  })
  return (res.rows || []).map(r => r.settlement_period as string)
}
