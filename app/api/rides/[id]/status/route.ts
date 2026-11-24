import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { verifyRideToken } from '@/lib/ride-token'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const rideId = Number(id)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const pickupLat = Number(searchParams.get('lat') || 6.2088)
    const pickupLng = Number(searchParams.get('lng') || -75.567)

    const { userId } = await auth().catch(() => ({ userId: null }))
    const validGuestToken = verifyRideToken(token, rideId)

    if (!validGuestToken && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const res = await db.execute({
      sql: `SELECT
              o.id, o.booking_reference, o.status, o.dispatch_status, o.payment_status,
              o.package_name, o.package_price, o.destination_address, o.assigned_to, o.clerk_user_id,
              d.name as driver_name, d.phone as driver_phone, d.vehicle as driver_vehicle,
              d.plate as driver_plate, d.rating as driver_rating,
              dl.lat as driver_lat, dl.lng as driver_lng, dl.updated_at as gps_updated_at
            FROM orders o
            LEFT JOIN drivers d ON o.assigned_to = d.id
            LEFT JOIN driver_locations dl ON dl.driver_id = d.id AND dl.gps_consent = 1
            WHERE o.id = ?
            LIMIT 1`,
      args: [rideId],
    })

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    const row = res.rows[0] as any
    if (!validGuestToken && row.clerk_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Auto-cascade queue: if still unassigned and last offer is >30s old or declined, offer to next closest driver
    let queueAttempt = 1
    let waitSeconds = 0
    if (!row.assigned_to && row.status !== 'cancelled' && row.status !== 'completed') {
      try {
        const offersRes = await db.execute({
          sql: `SELECT id, driver_id, status, created_at FROM assignments WHERE order_id = ? ORDER BY id DESC`,
          args: [Number(id)],
        })
        const offers = offersRes.rows as any[]
        queueAttempt = Math.max(1, offers.length)
        const latest = offers[0]
        const latestAgeSec = latest?.created_at
          ? Math.max(0, Math.floor((Date.now() - new Date(String(latest.created_at) + 'Z').getTime()) / 1000))
          : 0
        waitSeconds = latestAgeSec

        const needsNextDriver = !latest || latest.status === 'declined' || (['offered', 'pending_acceptance'].includes(latest.status) && latestAgeSec >= 30)
        if (needsNextDriver) {
          if (latest && ['offered', 'pending_acceptance'].includes(latest.status) && latestAgeSec >= 30) {
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
          const nextCandidate = (availRes.rows as any[])
            .filter(d => !triedIds.includes(Number(d.id)))
            .map(d => ({
              id: Number(d.id),
              dist: (d.lat != null && d.lng != null) ? haversineKm(Number(d.lat), Number(d.lng), pickupLat, pickupLng) : 999,
              rating: Number(d.rating || 0),
            }))
            .sort((a, b) => a.dist - b.dist || b.rating - a.rating)[0]

          if (nextCandidate) {
            queueAttempt = offers.length + 1
            await db.execute({
              sql: `INSERT INTO assignments (order_id, driver_id, status, pickup_date, pickup_time, notes, created_at)
                    VALUES (?, ?, 'pending_acceptance', date('now'), time('now'), ?, datetime('now'))`,
              args: [Number(id), nextCandidate.id, `ON-DEMAND · Cola #${queueAttempt} (cascada automática)`],
            })
          }
        }
      } catch { /* non-critical */ }
    }

    let etaMinutes: number | null = null
    let distanceKm: number | null = null

    if (row.driver_lat != null && row.driver_lng != null) {
      const straight = haversineKm(Number(row.driver_lat), Number(row.driver_lng), pickupLat, pickupLng)
      distanceKm = Math.round(straight * 1.35 * 10) / 10
      etaMinutes = Math.max(2, Math.round((distanceKm / 30) * 60))
    }

    return NextResponse.json({
      success: true,
      ride: {
        id: row.id,
        bookingReference: row.booking_reference,
        status: row.status,
        dispatchStatus: row.dispatch_status,
        paymentStatus: row.payment_status,
        packageName: row.package_name,
        price: row.package_price,
        destinationAddress: row.destination_address,
        driver: row.assigned_to
          ? {
              id: row.assigned_to,
              name: row.driver_name,
              phone: row.driver_phone,
              vehicle: row.driver_vehicle,
              plate: row.driver_plate,
              rating: row.driver_rating,
              lat: row.driver_lat,
              lng: row.driver_lng,
              gpsUpdatedAt: row.gps_updated_at,
            }
          : null,
        distanceKm,
        etaMinutes,
        queueAttempt,
        waitSeconds,
      },
    })
  } catch (err) {
    console.error('[Ride Status] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch ride status' }, { status: 500 })
  }
}
