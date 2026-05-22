import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bookingStore } from '@/app/components/booking/lib/booking-store'

const PACKAGE_NAMES: Record<string, string> = {
  'smooth-landing': 'Smooth Landing',
  'first-24': 'First 24 Hours',
  'full-insider': 'Full Insider',
}

const PACKAGE_PRICES: Record<string, number> = {
  'smooth-landing': 89,
  'first-24': 149,
  'full-insider': 249,
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('[Booking]', JSON.stringify(body, null, 2))

    // Keep in-memory store for backward compat
    bookingStore.add(body)

    // Persist to database
    const db = getDb()
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
    const bookingRef = body.id || orderNumber
    const pkg = body.package || ''
    const customer = body.customer || {}
    const flight = body.flight || {}
    const dest = body.destination || {}

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
        PACKAGE_NAMES[pkg] || pkg,
        PACKAGE_PRICES[pkg] || 0,
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
