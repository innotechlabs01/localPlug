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

    // Hotel booking fields
    const hotelId = dest.selectedHotelId || null
    const roomId = dest.selectedRoomId || null
    const isHotelBooking = hotelId ? 1 : 0
    let numNights = 0
    let hotelCommissionRate = 0.10

    if (isHotelBooking && flight.arrivalDate && flight.returnDate) {
      const arr = new Date(flight.arrivalDate)
      const ret = new Date(flight.returnDate)
      const diffMs = ret.getTime() - arr.getTime()
      numNights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    } else if (isHotelBooking) {
      numNights = 1
    }

    // Get hotel commission rate if booking a hotel
    if (isHotelBooking && hotelId) {
      try {
        const hotelResult = await db.execute({
          sql: `SELECT commission_rate FROM hotels WHERE id = ?`,
          args: [hotelId],
        })
        if (hotelResult.rows.length > 0) {
          hotelCommissionRate = Number(hotelResult.rows[0].commission_rate) || 0.10
        }
      } catch { /* non-critical */ }
    }

    // Use DB-backed async pricing instead of hardcoded values
    const [packageName, packageTotal] = await Promise.all([
      getPackageName(pkg),
      getPackageTotal(pkg, needReturn),
    ])

    // Transport-only base price
    let packagePrice = packageTotal
    const transportPrice = packageTotal

    // Add hotel room cost to package_price if booking a hotel
    let hotelBaseAmount = 0
    if (isHotelBooking && roomId) {
      try {
        const roomResult = await db.execute({
          sql: `SELECT price_per_night FROM rooms WHERE id = ? AND hotel_id = ?`,
          args: [roomId, hotelId],
        })
        if (roomResult.rows.length > 0) {
          const roomPricePerNight = Number(roomResult.rows[0].price_per_night) || 0
          hotelBaseAmount = roomPricePerNight * numNights
          // Customer pays room cost with commission markup
          const roomWithCommission = hotelBaseAmount * (1 + hotelCommissionRate)
          // Final package_price = transport + rooms with commission
          packagePrice = transportPrice + roomWithCommission
        }
      } catch { /* non-critical */ }
    }

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
        traveler_profile, status, dispatch_status, payment_status,
        hotel_id, room_id, num_nights, is_hotel_booking, hotel_commission_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        hotelId,
        roomId,
        numNights,
        isHotelBooking,
        hotelCommissionRate,
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
