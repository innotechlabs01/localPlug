import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createPolar } from '@polar-sh/sdk/2026-04'
import { getDb } from '@/lib/db'
import { ensureRidePricingTable } from '@/lib/ride-pricing'
import { calculateRideQuote, validateRideTaxRate } from '@/lib/rides/fare'
import { getTaxRate } from '@/lib/settings'
import { signRideToken } from '@/lib/ride-token'
import { ensureRideDispatchSchema, sweepStaleRideOffers } from '@/lib/rides/offer-lifecycle'
import { setPayment } from '@/lib/services/payment-service'
import type { PaymentRecord } from '@/lib/payment-record'

function getPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN || ''
  if (!accessToken) throw new Error('POLAR_ACCESS_TOKEN is not configured')
  return createPolar({
    accessToken,
    environment: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
  })
}

function getProductId(): string {
  const productId = process.env.POLAR_PRODUCT_ID || ''
  if (!productId) throw new Error('POLAR_PRODUCT_ID is not configured')
  return productId
}

type DbClient = ReturnType<typeof getDb>

async function ensureRideCheckoutSchema(db: DbClient) {
  // These columns are added lazily so existing Turso deployments do not need a
  // manual migration before the first paid ride is requested.
  const columns = [
    'ALTER TABLE orders ADD COLUMN pickup_lat REAL',
    'ALTER TABLE orders ADD COLUMN pickup_lng REAL',
    'ALTER TABLE orders ADD COLUMN destination_lat REAL',
    'ALTER TABLE orders ADD COLUMN destination_lng REAL',
    'ALTER TABLE orders ADD COLUMN ride_fare_usd REAL DEFAULT 0',
    'ALTER TABLE orders ADD COLUMN platform_fee_usd REAL DEFAULT 0',
    'ALTER TABLE orders ADD COLUMN driver_payout_usd REAL DEFAULT 0',
    'ALTER TABLE orders ADD COLUMN tax_rate REAL DEFAULT 0',
  ]
  for (const sql of columns) {
    await db.execute({ sql, args: [] }).catch(() => {})
  }
}

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const { userId } = await auth().catch(() => ({ userId: null }))

    const body = await request.json()
    const pickupAddress = String(body.pickupAddress || 'Ubicación GPS actual').trim()
    const destinationAddress = String(body.destinationAddress || '').trim()
    const stops: string[] = Array.isArray(body.stops)
      ? body.stops.map((s: unknown) => String(s || '').trim()).filter(Boolean).slice(0, 3)
      : []
    const category = String(body.category || 'standard').toLowerCase()
    const reportedKm = Number(body.distanceKm)
    const baseKm = Math.max(1, Math.min(120, Number.isFinite(reportedKm) ? reportedKm : 6))
    // The new rider UI sends the OSRM distance, which already includes every
    // selected stop as a waypoint. Legacy callers still get the old estimate.
    const distanceKm = body.distanceIncludesStops === true
      ? baseKm
      : Math.min(120, baseKm + stops.length * 2)
    const pickupLat = finiteNumber(body.pickupLat) ?? 6.2088
    const pickupLng = finiteNumber(body.pickupLng) ?? -75.567
    const destinationLat = finiteNumber(body.destinationLat)
    const destinationLng = finiteNumber(body.destinationLng)

    if (!destinationAddress) {
      return NextResponse.json({ error: 'Ingresa un destino válido' }, { status: 400 })
    }

    // IVA must be valid before any order or checkout exists. Never charge an
    // arbitrary amount because of a malformed settings value.
    const taxRate = validateRideTaxRate(await getTaxRate())

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
    if (customerEmail && !EMAIL_PATTERN.test(customerEmail)) {
      return NextResponse.json({ error: 'Ingresa un email válido para el recibo' }, { status: 400 })
    }

    // Dynamic fare, commission and IVA all come from Super Admin configuration.
    const pricingRows = await ensureRidePricingTable()
    const rule = pricingRows.find((r) => r.category === category) || pricingRows[0]
    const quote = calculateRideQuote(rule, distanceKm, taxRate)
    const amountCents = quote.totalCents

    const db = getDb()
    await ensureRideCheckoutSchema(db)
    await ensureRideDispatchSchema(db)
    await sweepStaleRideOffers(db)

    const bookingRef = `RIDE-${Date.now().toString(36).toUpperCase()}`
    const orderNumber = `OD-${Math.floor(100000 + Math.random() * 900000)}`
    const packageId = `on_demand_${rule.category}`
    const packageName = `Viaje On-Demand (${rule.label})`
    const stopsSummary = stops.length > 0 ? ` · Paradas: ${stops.join(' → ')}` : ''
    const notes = [
      `Recogida: ${pickupAddress}${stopsSummary}`,
      `${distanceKm} km · ~${quote.estimatedMinutes} min (${quote.speedKmh} km/h)`,
      `Tarifa: $${quote.subtotalUsd.toFixed(2)}`,
      `Comisión app (${quote.commPct}%): $${quote.platformFeeUsd.toFixed(2)}`,
      `IVA (${(quote.taxRate * 100).toFixed(0)}%): $${quote.taxUsd.toFixed(2)}`,
      `Total: $${quote.totalUsd.toFixed(2)}`,
    ].join(' · ')

    // Payment first: no driver is contacted until the paid webhook fires.
    const orderRes = await db.execute({
      sql: `INSERT INTO orders (
              order_number, booking_reference, clerk_user_id,
              customer_name, customer_email, customer_phone, customer_notes,
              package_id, package_name, package_price, currency,
              pickup_lat, pickup_lng, destination_address, destination_lat, destination_lng,
              ride_fare_usd, platform_fee_usd, driver_payout_usd,
              tax_rate, tax_amount_usd, service_fee_usd, grand_total_usd,
              additional_trips, traveler_profile,
              status, dispatch_status, payment_status,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'on_demand', 'awaiting_payment', 'awaiting_payment', 'pending', datetime('now'), datetime('now'))`,
      args: [
        orderNumber,
        bookingRef,
        userId || null,
        customerName,
        customerEmail || '',
        customerPhone || '',
        notes,
        packageId,
        packageName,
        quote.totalUsd,
        pickupLat,
        pickupLng,
        destinationAddress,
        destinationLat,
        destinationLng,
        quote.subtotalUsd,
        quote.platformFeeUsd,
        quote.driverPayoutUsd,
        quote.taxRate,
        quote.taxUsd,
        0,
        quote.totalUsd,
        stops.length > 0 ? JSON.stringify(stops) : null,
      ],
    })
    const orderId = Number(orderRes.lastInsertRowid)
    const rideToken = signRideToken(orderId, bookingRef)

    // Return to the host that started the request; NEXT_PUBLIC_SITE_URL can
    // point at production while the rider is using a local/portal domain.
    const siteUrl = new URL(request.url).origin
    const checkoutMetadata: Record<string, string> = {
      booking_reference: bookingRef,
      ride_id: String(orderId),
      package_id: packageId,
      package_name: packageName,
      customer_name: customerName,
      need_return: 'false',
      tour_ids: '[]',
      num_people: '1',
      destination_has_place: 'true',
      traveler_profile: 'on_demand',
      destination_address: destinationAddress,
      category,
      distance_km: String(distanceKm),
      fare_usd: quote.subtotalUsd.toFixed(2),
      commission_pct: String(quote.commPct),
      platform_fee_usd: quote.platformFeeUsd.toFixed(2),
      driver_payout_usd: quote.driverPayoutUsd.toFixed(2),
      tax_rate: String(quote.taxRate),
      tax_usd: quote.taxUsd.toFixed(2),
      total_usd: quote.totalUsd.toFixed(2),
    }
    // Polar validates metadata values as non-empty strings.
    if (userId) checkoutMetadata.clerk_user_id = userId
    if (customerEmail) checkoutMetadata.customer_email = customerEmail
    if (customerPhone) checkoutMetadata.customer_phone = customerPhone
    if (destinationLat != null) checkoutMetadata.destination_lat = String(destinationLat)
    if (destinationLng != null) checkoutMetadata.destination_lng = String(destinationLng)
    if (Number.isFinite(pickupLat)) checkoutMetadata.pickup_lat = String(pickupLat)
    if (Number.isFinite(pickupLng)) checkoutMetadata.pickup_lng = String(pickupLng)

    let checkout
    try {
      checkout = await getPolarClient().checkouts.create({
        products: [getProductId()],
        prices: {
          [getProductId()]: [{
            amount_type: 'fixed',
            price_amount: amountCents,
            price_currency: 'usd',
          }],
        },
        customer_email: customerEmail || undefined,
        customer_name: customerName,
        success_url: `${siteUrl}/ride?ride=${orderId}&token=${encodeURIComponent(rideToken)}&payment=confirmed`,
        metadata: checkoutMetadata,
        embed_origin: siteUrl,
      })
    } catch (checkoutError) {
      // Polar rejected the checkout after the order was inserted. Never leave a
      // paid-looking pending ride behind: it cannot be paid or dispatched.
      await db.execute({
        sql: `UPDATE orders
              SET status = 'cancelled', dispatch_status = 'cancelled',
                  payment_status = 'failed', updated_at = datetime('now')
              WHERE id = ?`,
        args: [orderId],
      }).catch(() => {})
      throw checkoutError
    }

    const now = new Date().toISOString()
    const record: PaymentRecord = {
      booking_reference: bookingRef,
      package_id: packageId,
      package_name: packageName,
      amount: amountCents,
      currency: 'usd',
      status: 'pending',
      polar_transaction_id: checkout.id,
      polar_webhook_event_id: '',
      customer_email: customerEmail || '',
      customer_name: customerName,
      customer_phone: customerPhone || '',
      error_message: null,
      created_at: now,
      updated_at: now,
    }
    await setPayment(record)

    return NextResponse.json({
      success: true,
      rideId: orderId,
      rideToken,
      bookingReference: bookingRef,
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      estimatedUsd: quote.totalUsd,
      totalUsd: quote.totalUsd,
      amountCents,
      estimatedMinutes: quote.estimatedMinutes,
      category: rule.label,
      status: 'awaiting_payment',
      quote,
    }, { status: 201 })
  } catch (err) {
    console.error('[Rides Request] POST error:', err)
    return NextResponse.json({ error: 'No se pudo crear la solicitud de viaje' }, { status: 500 })
  }
}
