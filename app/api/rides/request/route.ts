import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { ensureRidePricingTable, calculateRideFare } from '@/lib/ride-pricing'
import { signRideToken } from '@/lib/ride-token'

export async function POST(request: Request) {
  try {
    const { userId } = await auth().catch(() => ({ userId: null }))

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

    let customerName = String(body.guestName || '').trim()
    let customerEmail = String(body.guestEmail || '').trim().toLowerCase()
    const customerPhone = String(body.guestPhone || '').trim()

    if (userId) {
      try {
        const client = await clerkClient()
        const u = await client.users.getUser(userId)
        if (!customerName) customerName = `${u.firstName || ''} ${u.lastName || ''}`.trim()
        if (!customerEmail) customerEmail = u.primaryEmailAddress?.emailAddress || ''
      } catch { /* non-critical */ }
    }

    if (!customerName) customerName = 'Pasajero'
    if (!customerEmail && !customerPhone) {
      return NextResponse.json({ error: 'Ingresa tu email o WhatsApp para el recibo y contacto del conductor' }, { status: 400 })
    }

    // Dynamic fare calculated from Super Admin pricing table (base + km + minute + speed)
    const pricingRows = await ensureRidePricingTable()
    const rule = pricingRows.find(r => r.category === category) || pricingRows[0]
    const { totalUsd: estimatedUsd, estimatedMinutes, speedKmh } = calculateRideFare(rule, distanceKm)

    const db = getDb()
    const bookingRef = `RIDE-${Date.now().toString(36).toUpperCase()}`
    const orderNumber = `OD-${Math.floor(100000 + Math.random() * 900000)}`

    const orderRes = await db.execute({
      sql: `INSERT INTO orders (
              order_number, booking_reference, clerk_user_id,
              customer_name, customer_email, customer_phone, customer_notes,
              package_id, package_name, package_price, currency,
              destination_address, traveler_profile,
              status, dispatch_status, payment_status,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, 'on_demand', 'pending', 'pending', 'card_authorized', datetime('now'), datetime('now'))`,
      args: [
        orderNumber,
        bookingRef,
        userId || null,
        customerName,
        customerEmail || '',
        customerPhone || '',
        `Recogida: ${pickupAddress} (${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}) · ${distanceKm} km · ~${estimatedMinutes} min (${speedKmh} km/h)`,
        `on_demand_${rule.category}`,
        `Viaje On-Demand (${rule.label})`,
        estimatedUsd,
        destinationAddress,
      ],
    })
    const orderId = Number(orderRes.lastInsertRowid)
    const rideToken = signRideToken(orderId, bookingRef)

    // Offer to closest available ONLINE driver by GPS zone proximity (using 'pending_acceptance' so /accept succeeds!)
    let offeredDriverId: number | null = null
    let queueSize = 0
    try {
      const drvRes = await db.execute({
        sql: `SELECT d.id, dl.lat, dl.lng, d.rating, d.category
              FROM drivers d
              LEFT JOIN driver_locations dl ON dl.driver_id = d.id AND dl.gps_consent = 1
              WHERE d.status = 'available'`,
        args: [],
      })
      const candidates = (drvRes.rows as any[]).map(d => {
        const dist = (d.lat != null && d.lng != null)
          ? Math.hypot(Number(d.lat) - pickupLat, Number(d.lng) - pickupLng)
          : 999
        const catMatch = String(d.category || '').toLowerCase() === rule.category ? 0 : 1
        return { id: Number(d.id), dist, catMatch, rating: Number(d.rating || 0) }
      }).sort((a, b) => a.catMatch - b.catMatch || a.dist - b.dist || b.rating - a.rating)

      queueSize = candidates.length
      if (candidates.length > 0) {
        offeredDriverId = candidates[0].id
        await db.execute({
          sql: `INSERT INTO assignments (order_id, driver_id, status, pickup_date, pickup_time, notes, created_at)
                VALUES (?, ?, 'pending_acceptance', date('now'), time('now'), ?, datetime('now'))`,
          args: [orderId, offeredDriverId, `ON-DEMAND · Cola #1/${queueSize} · Recogida: ${pickupAddress}`],
        })
      }
    } catch (e) {
      console.warn('[On-Demand Request] Auto-offer warning:', e)
    }

    return NextResponse.json({
      success: true,
      rideId: orderId,
      rideToken,
      bookingReference: bookingRef,
      estimatedUsd,
      estimatedMinutes,
      category: rule.label,
      offeredDriverId,
      queueSize,
      status: 'searching',
    }, { status: 201 })
  } catch (err) {
    console.error('[Rides Request] POST error:', err)
    return NextResponse.json({ error: 'No se pudo crear la solicitud de viaje' }, { status: 500 })
  }
}
