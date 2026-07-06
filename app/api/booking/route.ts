import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getPackageName, getPackageTotal } from '@/lib/config'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()

    console.log('[Booking]', JSON.stringify(body, null, 2))

    const db = getDb()
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
    const bookingRef = body.id || orderNumber
    const pkg = body.package || ''
    const customer = body.customer || {}
    const flight = body.flight || {}
    const dest = body.destination || {}
    const needReturn = flight.needReturn ?? false

    // Use DB-backed async pricing instead of hardcoded values
    const [packageName, packagePrice] = await Promise.all([
      getPackageName(pkg),
      getPackageTotal(pkg, needReturn),
    ])

    // Explicit duplicate check: if booking_reference already exists, return conflict
    const existing = await db.execute({
      sql: `SELECT id FROM orders WHERE booking_reference = ?`,
      args: [bookingRef],
    })
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { status: 'error', message: 'This booking reference already exists.' },
        { status: 409 },
      )
    }

    await db.execute({
      sql: `INSERT INTO orders (
        order_number, booking_reference, customer_name, customer_email, customer_phone,
        customer_country, customer_notes, return_date, return_time,
        package_id, package_name, package_price, currency,
        flight_number, airline, arrival_date, arrival_time,
        destination_address, destination_has_place, additional_trips,
        traveler_profile, status, dispatch_status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orderNumber,
        bookingRef,
        customer.name || null,
        customer.email || null,
        customer.phone || null,
        customer.country || null,
        customer.notes || null,
        flight.returnDate || null,
        flight.returnTime || null,
        pkg,
        packageName,
        packagePrice,
        'usd',
        flight.flightNumber || null,
        flight.airline || null,
        flight.arrivalDate || null,
        flight.arrivalTime || null,
        dest.address || null,
        dest.hasPlace ? 1 : 0,
        dest.additionalTrips ? JSON.stringify(dest.additionalTrips) : null,
        body.profile || null,
        'new',
        'pending',
        'pending',
      ],
    })

    console.log('[Booking] Order created:', orderNumber)

    // Check if payment was already completed (webhook may have fired before POST /api/booking)
    const paymentCheck = await db.execute({
      sql: `SELECT status FROM payments WHERE booking_reference = ? AND status = 'completed'`,
      args: [bookingRef],
    })
    if (paymentCheck.rows.length > 0) {
      await db.execute({
        sql: `UPDATE orders SET status = 'confirmed', payment_status = 'paid', updated_at = ? WHERE booking_reference = ?`,
        args: [new Date().toISOString(), bookingRef],
      })
      console.log('[Booking] Order auto-confirmed from existing completed payment', { bookingReference: bookingRef })
    }

    return NextResponse.json(
      { status: 'success', message: 'Booking confirmed. We will contact you via WhatsApp within 2 hours.', orderNumber },
      { status: 200 },
    )
  } catch (err) {
    console.error('[Booking] Error:', err)
    return NextResponse.json(
      { status: 'error', message: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
