import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

const VEHICLE_RATES: Record<string, { label: string; baseUsd: number; perKmUsd: number }> = {
  standard: { label: 'Standard', baseUsd: 8, perKmUsd: 1.2 },
  suv: { label: 'SUV', baseUsd: 14, perKmUsd: 1.8 },
  vip: { label: 'VIP', baseUsd: 22, perKmUsd: 2.5 },
  luxury: { label: 'Luxury', baseUsd: 35, perKmUsd: 3.5 },
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión para solicitar un viaje' }, { status: 401 })
    }

    const body = await request.json()
    const pickupAddress = String(body.pickupAddress || 'Ubicación GPS actual').trim()
    const destinationAddress = String(body.destinationAddress || '').trim()
    const category = String(body.category || 'standard').toLowerCase()
    const distanceKm = Math.max(1, Math.min(120, Number(body.distanceKm) || 6))
    const pickupLat = body.pickupLat != null ? Number(body.pickupLat) : 6.2088
    const pickupLng = body.pickupLng != null ? Number(body.pickupLng) : -75.567

    if (!destinationAddress) {
      return NextResponse.json({ error: 'Ingresa un destino válido' }, { status: 400 })
    }

    const rate = VEHICLE_RATES[category] || VEHICLE_RATES.standard
    const estimatedUsd = Math.round((rate.baseUsd + distanceKm * rate.perKmUsd) * 100) / 100

    let customerName = 'Cliente'
    let customerEmail = ''
    try {
      const client = await clerkClient()
      const u = await client.users.getUser(userId)
      customerName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.primaryEmailAddress?.emailAddress || 'Cliente'
      customerEmail = u.primaryEmailAddress?.emailAddress || ''
    } catch { /* non-critical */ }

    const db = getDb()
    const bookingRef = `RIDE-${Date.now().toString(36).toUpperCase()}`
    const orderNumber = `OD-${Math.floor(100000 + Math.random() * 900000)}`

    // Create on-demand order (clearly tagged as on_demand in package_id & traveler_profile)
    const orderRes = await db.execute({
      sql: `INSERT INTO orders (
              order_number, booking_reference, clerk_user_id,
              customer_name, customer_email, customer_notes,
              package_id, package_name, package_price, currency,
              destination_address, traveler_profile,
              status, dispatch_status, payment_status,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, 'on_demand', 'pending', 'pending', 'card_authorized', datetime('now'), datetime('now'))`,
      args: [
        orderNumber,
        bookingRef,
        userId,
        customerName,
        customerEmail,
        `Recogida: ${pickupAddress} (${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}) · Distancia est: ${distanceKm} km`,
        `on_demand_${category}`,
        `Viaje On-Demand (${rate.label})`,
        estimatedUsd,
        destinationAddress,
      ],
    })
    const orderId = Number(orderRes.lastInsertRowid)

    // Offer to closest available ONLINE driver by GPS zone proximity (fallback: rating)
    let offeredDriverId: number | null = null
    let queueSize = 0
    try {
      const drvRes = await db.execute({
        sql: `SELECT d.id, dl.lat, dl.lng, d.rating
              FROM drivers d
              LEFT JOIN driver_locations dl ON dl.driver_id = d.id AND dl.gps_consent = 1
              WHERE d.status = 'available'`,
        args: [],
      })
      const candidates = (drvRes.rows as any[]).map(d => {
        const dist = (d.lat != null && d.lng != null)
          ? Math.hypot(Number(d.lat) - pickupLat, Number(d.lng) - pickupLng)
          : 999
        return { id: Number(d.id), dist, rating: Number(d.rating || 0) }
      }).sort((a, b) => a.dist - b.dist || b.rating - a.rating)

      queueSize = candidates.length
      if (candidates.length > 0) {
        offeredDriverId = candidates[0].id
        await db.execute({
          sql: `INSERT INTO assignments (order_id, driver_id, status, pickup_date, pickup_time, notes, created_at)
                VALUES (?, ?, 'offered', date('now'), time('now'), ?, datetime('now'))`,
          args: [orderId, offeredDriverId, `ON-DEMAND · Cola #1/${queueSize} · Recogida: ${pickupAddress}`],
        })
      }
    } catch (e) {
      console.warn('[On-Demand Request] Auto-offer warning:', e)
    }

    return NextResponse.json({
      success: true,
      rideId: orderId,
      bookingReference: bookingRef,
      estimatedUsd,
      category: rate.label,
      offeredDriverId,
      queueSize,
      status: 'searching',
    }, { status: 201 })
  } catch (err) {
    console.error('[Rides Request] POST error:', err)
    return NextResponse.json({ error: 'No se pudo crear la solicitud de viaje' }, { status: 500 })
  }
}
