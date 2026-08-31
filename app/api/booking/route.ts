import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getPackageName, getPackageTotal } from '@/lib/config'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { z } from 'zod'

const BookingSchema = z.object({
  id: z.string().max(100).optional(),
  package: z.string().min(1).max(50),
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    country: z.string().max(100).optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
  }).partial().default({}),
  flight: z.object({
    flightNumber: z.string().max(20).optional().or(z.literal('')),
    airline: z.string().max(100).optional().or(z.literal('')),
    arrivalDate: z.string().max(20).optional().or(z.literal('')),
    arrivalTime: z.string().max(20).optional().or(z.literal('')),
    returnDate: z.string().max(20).optional().or(z.literal('')),
    returnTime: z.string().max(20).optional().or(z.literal('')),
    needReturn: z.boolean().optional(),
  }).partial().default({}),
  destination: z.object({
    address: z.string().max(500).optional().or(z.literal('')),
    hasPlace: z.boolean().optional(),
    additionalTrips: z.array(z.union([z.string(), z.number()])).max(10).optional(),
    numPeople: z.number().int().min(1).max(50).optional(),
    selectedHotelId: z.number().int().optional(),
    selectedRoomId: z.number().int().optional(),
  }).partial().default({}),
  profile: z.string().max(500).optional().or(z.literal('')),
  consents: z.object({
    terms: z.boolean(),
    privacy: z.boolean(),
    refund: z.boolean(),
    termsVersion: z.string().max(10).optional(),
    privacyVersion: z.string().max(10).optional(),
    refundVersion: z.string().max(10).optional(),
    acceptedAt: z.string().max(30).optional(),
  }).optional(),
}).strip()

export async function POST(request: Request) {
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const rawBody = await request.json()

    const parsed = BookingSchema.safeParse(rawBody)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { status: 'error', message: `Invalid request: ${firstError.path.join('.')} — ${firstError.message}` },
        { status: 400 },
      )
    }

    const body = parsed.data
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
    const additionalTrips = Array.isArray(dest.additionalTrips) ? dest.additionalTrips : []
    const numPeople = Math.max(1, Math.floor(Number(dest.numPeople) || 1))
    const [packageName, packageTotal] = await Promise.all([
      getPackageName(pkg),
      getPackageTotal(pkg, needReturn, additionalTrips.map(String), numPeople),
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

    // Room availability check — prevent double booking
    if (isHotelBooking && roomId && hotelId && flight.arrivalDate) {
      const checkIn = flight.arrivalDate
      const checkOut = flight.returnDate || flight.arrivalDate
      try {
        const overlap = await db.execute({
          sql: `SELECT id FROM room_bookings
                WHERE room_id = ? AND status IN ('confirmed', 'checked_in')
                AND check_in < ? AND check_out > ?`,
          args: [roomId, checkOut, checkIn],
        })
        if (overlap.rows.length > 0) {
          return NextResponse.json(
            { status: 'error', message: 'Selected room is not available for the requested dates.' },
            { status: 409 },
          )
        }
        // Also check room status
        const roomStatus = await db.execute({
          sql: `SELECT status FROM rooms WHERE id = ? AND hotel_id = ?`,
          args: [roomId, hotelId],
        })
        if (roomStatus.rows.length > 0 && (roomStatus.rows[0].status as string) === 'maintenance') {
          return NextResponse.json(
            { status: 'error', message: 'Selected room is under maintenance.' },
            { status: 409 },
          )
        }
      } catch { /* table may not exist yet — skip check */ }
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
        hotel_id, room_id, num_nights, is_hotel_booking, hotel_commission_rate,
        num_people
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        additionalTrips.length > 0 ? JSON.stringify(additionalTrips) : null,
        body.profile || null,
        'new',
        'pending',
        'pending',
        hotelId,
        roomId,
        numNights,
        isHotelBooking,
        hotelCommissionRate,
        numPeople,
      ],
    })

    console.log('[Booking] Order created:', orderNumber)

    // Create room_bookings record and update room availability
    if (isHotelBooking && roomId && hotelId && flight.arrivalDate) {
      try {
        const checkIn = flight.arrivalDate
        const checkOut = flight.returnDate || flight.arrivalDate
        const orderResult = await db.execute({
          sql: `SELECT id FROM orders WHERE booking_reference = ?`,
          args: [bookingRef],
        })
        const orderId = orderResult.rows[0]?.id as number | undefined
        if (orderId) {
          const roomPriceResult = await db.execute({
            sql: `SELECT price_per_night FROM rooms WHERE id = ? AND hotel_id = ?`,
            args: [roomId, hotelId],
          })
          const pricePerNight = Number(roomPriceResult.rows[0]?.price_per_night) || 0
          const totalAmount = pricePerNight * numNights

          await db.execute({
            sql: `INSERT INTO room_bookings (order_id, room_id, hotel_id, check_in, check_out, nights, price_per_night, total_amount, guest_name, guest_email, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
            args: [orderId, roomId, hotelId, checkIn, checkOut, numNights, pricePerNight, totalAmount, customer.name || '', customer.email || ''],
          })

          await db.execute({
            sql: `UPDATE rooms SET status = 'occupied', available_from = ?, current_order_id = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [checkOut, orderId, roomId],
          })
        }
      } catch (roomErr) {
        console.error('[Booking] Failed to create room_bookings record:', roomErr)
        // Non-critical — order already created, room booking can be fixed manually
      }
    }

    // Save consent records (Ley 1581 de 2012 compliance)
    if (body.consents) {
      try {
        const consent = body.consents
        await db.execute({
          sql: `INSERT INTO consent_records (booking_reference, customer_email, terms_accepted, privacy_accepted, refund_accepted, terms_version, privacy_version, refund_version, accepted_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            bookingRef,
            customer.email || '',
            consent.terms ? 1 : 0,
            consent.privacy ? 1 : 0,
            consent.refund ? 1 : 0,
            consent.termsVersion || '1.0',
            consent.termsVersion || '1.0',
            consent.termsVersion || '1.0',
            consent.acceptedAt || new Date().toISOString(),
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            request.headers.get('user-agent') || '',
          ],
        })
      } catch (consentErr) {
        console.error('[Booking] Failed to save consent record:', consentErr)
        // Non-critical — don't block booking
      }
    }

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
