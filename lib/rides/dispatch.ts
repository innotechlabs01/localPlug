import type { DatabaseClient } from '@lp/db/factory'

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export type DispatchResult = {
  offeredDriverId: number | null
  queueAttempt: number
  waitSeconds: number
}

/**
 * Offer a ride only after its payment is confirmed. The cascade lives here so
 * the rider status poll and the paid webhook share one idempotent path.
 */
export async function dispatchPaidRide(
  db: DatabaseClient,
  rideId: number,
  pickupLat: number = 6.2088,
  pickupLng: number = -75.567,
): Promise<DispatchResult> {
  const idle: DispatchResult = { offeredDriverId: null, queueAttempt: 1, waitSeconds: 0 }
  const orderRes = await db.execute({
    sql: `SELECT id, status, payment_status, assigned_to FROM orders WHERE id = ? LIMIT 1`,
    args: [rideId],
  })
  const order = orderRes.rows[0] as Record<string, unknown> | undefined
  if (!order) return idle

  if (String(order.payment_status) !== 'paid') return idle
  if (['cancelled', 'completed'].includes(String(order.status))) return idle
  if (order.assigned_to != null && order.assigned_to !== '') return idle

  if (String(order.status) === 'awaiting_payment') {
    await db.execute({
      sql: `UPDATE orders SET status = 'searching', dispatch_status = 'pending', updated_at = datetime('now') WHERE id = ?`,
      args: [rideId],
    })
  }

  const offersRes = await db.execute({
    sql: `SELECT id, driver_id, status, created_at FROM assignments WHERE order_id = ? ORDER BY id DESC`,
    args: [rideId],
  })
  const offers = offersRes.rows as Array<Record<string, unknown>>
  const latest = offers[0]
  const latestAgeSec = latest?.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(`${String(latest.created_at)}Z`).getTime()) / 1000))
    : 0

  const needsNextDriver =
    !latest ||
    String(latest.status) === 'declined' ||
    (['offered', 'pending_acceptance'].includes(String(latest.status)) && latestAgeSec >= 30)

  if (!needsNextDriver) {
    return { offeredDriverId: null, queueAttempt: Math.max(1, offers.length), waitSeconds: latestAgeSec }
  }

  if (latest && ['offered', 'pending_acceptance'].includes(String(latest.status)) && latestAgeSec >= 30) {
    await db.execute({ sql: `UPDATE assignments SET status = 'expired' WHERE id = ?`, args: [Number(latest.id)] })
  }

  const triedIds = offers.map(o => Number(o.driver_id))
  const availRes = await db.execute({
    sql: `SELECT d.id, dl.lat, dl.lng, d.rating
          FROM drivers d
          LEFT JOIN driver_locations dl ON dl.driver_id = d.id AND dl.gps_consent = 1
          WHERE d.status = 'available'`,
    args: [],
  })
  const nextCandidate = (availRes.rows as Array<Record<string, unknown>>)
    .filter(d => !triedIds.includes(Number(d.id)))
    .map(d => ({
      id: Number(d.id),
      dist: d.lat != null && d.lng != null
        ? haversineKm(Number(d.lat), Number(d.lng), pickupLat, pickupLng)
        : 999,
      rating: Number(d.rating || 0),
    }))
    .sort((a, b) => a.dist - b.dist || b.rating - a.rating)[0]

  if (!nextCandidate) {
    return { offeredDriverId: null, queueAttempt: offers.length + 1, waitSeconds: latestAgeSec }
  }

  const queueAttempt = offers.length + 1
  await db.execute({
    sql: `INSERT INTO assignments (order_id, driver_id, status, pickup_date, pickup_time, observations, created_at)
          VALUES (?, ?, 'pending_acceptance', date('now'), time('now'), ?, datetime('now'))`,
    args: [rideId, nextCandidate.id, `ON-DEMAND · Cola #${queueAttempt} (cascada automática)`],
  })

  return { offeredDriverId: nextCandidate.id, queueAttempt, waitSeconds: latestAgeSec }
}
