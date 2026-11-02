'use server'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { getPackageName, getPackageTotal } from '@/lib/config'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { emitEvent } from '@/lib/events-outbox'
import { z } from 'zod'
import { sendOrQueueWhatsApp } from '@/lib/n8n/client'
import { sendEmail } from '@/lib/email'

const BookingSchema = z.object({
  id: z.string().max(100).optional(),
  package: z.string().min(1).max(50),
  customer: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    country: z.string().max(100).optional().or(z.literal('')),
    language: z.string().max(10).optional().or(z.literal('')),
    language_code: z.string().max(10).optional().or(z.literal('')),
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
  // 1. Rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  // 2. AUTENTICACIÓN OBLIGATORIA
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json(
      { status: 'error', message: 'Debes iniciar sesión para hacer una reserva.' },
      { status: 401 },
    )
  }

  try {
    const rawBody = await request.json()

    const parsed = BookingSchema.safeParse(rawBody)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { status: 'error', message: `Datos inválidos: ${firstError.path.join('.')} — ${firstError.message}` },
        { status: 400 },
      )
    }

    const body = parsed.data
    const db = getDb()
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
    const bookingRef = body.id || orderNumber
    const pkg = body.package || ''
    const customer = body.customer || {}
    const flight = body.flight || {}
    const dest = body.destination || {}
    const needReturn = flight.needReturn ?? false

    // 3. Validar hotel y habitación
    const hotelId = dest.selectedHotelId || null
    const roomId = dest.selectedRoomId || null
    const isHotelBooking = hotelId ? 1 : 0
    let numNights = 0
    let hotelCommissionRate = 0.10
    let hotelBaseAmount = 0

    if (isHotelBooking && hotelId) {
      const hotelResult = await db.execute({
        sql: `SELECT commission_rate FROM hotels WHERE id = ?`,
        args: [hotelId],
      })
      if (hotelResult.rows.length === 0) {
        return NextResponse.json(
          { status: 'error', message: 'El hotel seleccionado no existe.' },
          { status: 400 },
        )
      }
      hotelCommissionRate = Number(hotelResult.rows[0].commission_rate) || 0.10
    }

    if (isHotelBooking && flight.arrivalDate && flight.returnDate) {
      const arr = new Date(flight.arrivalDate)
      const ret = new Date(flight.returnDate)
      const diffMs = ret.getTime() - arr.getTime()
      numNights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    } else if (isHotelBooking) {
      numNights = 1
    }

    const additionalTrips = Array.isArray(dest.additionalTrips) ? dest.additionalTrips : []
    const numPeople = Math.max(1, Math.floor(Number(dest.numPeople) || 1))
    const [packageName, packageTotal] = await Promise.all([
      getPackageName(pkg),
      getPackageTotal(pkg, needReturn, additionalTrips.map(String), numPeople),
    ])

    let packagePrice = packageTotal
    const transportPrice = packageTotal

    // 4. Validar habitación disponible (pre-check)
    if (isHotelBooking && roomId && hotelId) {
      const roomResult = await db.execute({
        sql: `SELECT price_per_night, status FROM rooms WHERE id = ? AND hotel_id = ?`,
        args: [roomId, hotelId],
      })
      if (roomResult.rows.length === 0) {
        return NextResponse.json(
          { status: 'error', message: 'La habitación seleccionada no existe.' },
          { status: 400 },
        )
      }
      const roomPricePerNight = Number(roomResult.rows[0].price_per_night) || 0
      const roomStatus = roomResult.rows[0].status as string
      if (roomStatus !== 'available') {
        return NextResponse.json(
          { status: 'error', message: 'La habitación seleccionada no está disponible.' },
          { status: 409 },
        )
      }
      hotelBaseAmount = roomPricePerNight * numNights
      const roomWithCommission = hotelBaseAmount * (1 + hotelCommissionRate)
      packagePrice = transportPrice + roomWithCommission
    }

    // 5. CHECK DE DISPONIBILIDAD (read-only)
    if (isHotelBooking && roomId && hotelId && flight.arrivalDate) {
      const checkIn = flight.arrivalDate
      const checkOut = flight.returnDate || flight.arrivalDate
      const overlap = await db.execute({
        sql: `SELECT id FROM room_bookings
              WHERE room_id = ? AND status IN ('confirmed', 'checked_in')
                AND check_in < ? AND check_out > ?`,
        args: [roomId, checkOut, checkIn],
      })
      if (overlap.rows.length > 0) {
        return NextResponse.json(
          { status: 'error', message: 'La habitación ya no está disponible para esas fechas.' },
          { status: 409 },
        )
      }
    }

    // 6. Transacción atómica: insertar orden + crear room_booking + actualizar habitación
    const orderResult = await db.execute({
      sql: `INSERT INTO orders (
        order_number, booking_reference, clerk_user_id, customer_name, customer_email, customer_phone,
        customer_country, customer_language, customer_language_code, customer_notes,
        return_date, return_time,
        package_id, package_name, package_price, currency,
        flight_number, airline, arrival_date, arrival_time,
        destination_address, destination_has_place, additional_trips,
        traveler_profile, status, dispatch_status, payment_status,
        hotel_id, room_id, num_nights, is_hotel_booking, hotel_commission_rate,
        num_people
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orderNumber,
        bookingRef,
        clerkId,
        customer.name || null,
        customer.email || null,
        customer.phone || null,
        customer.country || null,
        customer.language || null,
        customer.language_code || null,
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

    const orderId = Number(orderResult.rows[0]?.id)

    // Crear room_booking y actualizar habitación si es reserva de hotel
    if (isHotelBooking && roomId && hotelId && flight.arrivalDate && orderId) {
      const checkIn = flight.arrivalDate
      const checkOut = flight.returnDate || flight.arrivalDate
      const roomPriceResult = await db.execute({
        sql: `SELECT price_per_night FROM rooms WHERE id = ? AND hotel_id = ?`,
        args: [roomId, hotelId],
      })
      const pricePerNight = Number(roomPriceResult.rows[0]?.price_per_night) || 0
      const totalAmount = pricePerNight * numNights

      await db.batch([
        {
          sql: `INSERT INTO room_bookings (order_id, room_id, hotel_id, check_in, check_out, nights, price_per_night, total_amount, guest_name, guest_email, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
          args: [orderId, roomId, hotelId, checkIn, checkOut, numNights, pricePerNight, totalAmount, customer.name || '', customer.email || ''],
        },
        {
          sql: `UPDATE rooms SET status = 'occupied', available_from = ?, current_order_id = ?, updated_at = datetime('now') WHERE id = ? AND status = 'available'`,
          args: [checkOut, orderId, roomId],
        },
      ])
    }

    // 7. Guardar consentimientos (Ley 1581)
    if (body.consents) {
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
          consent.privacyVersion || '1.0',
          consent.refundVersion || '1.0',
          consent.acceptedAt || new Date().toISOString(),
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
          request.headers.get('user-agent') || '',
        ],
      })
    }

    console.log('[Booking] Order created:', orderNumber)

    // 8. Enviar WhatsApp de confirmación al cliente inmediatamente
    const lang = (customer.language_code || customer.language || 'es').toLowerCase()
    const msgEs = `Hola ${customer.name}! Reserva ${orderNumber} creada.\nPaquete: ${packageName}\nLlegada: ${flight.arrivalDate || '-'} ${flight.arrivalTime || ''}\nVuelo: ${flight.flightNumber || '-'}\nDestino: ${dest.address || '-'}\nPrecio: ${packagePrice.toFixed(2)} USD\nRef: ${bookingRef}\nVer: https://www.medellinpremium.com/mis-reservas\nTe contactamos para confirmar pago.`
    const msgEn = `Hi ${customer.name}! Booking ${orderNumber} created.\nPackage: ${packageName}\nArrival: ${flight.arrivalDate || '-'} ${flight.arrivalTime || ''}\nFlight: ${flight.flightNumber || '-'}\nDestination: ${dest.address || '-'}\nPrice: ${packagePrice.toFixed(2)} USD\nRef: ${bookingRef}\nView: https://www.medellinpremium.com/mis-reservas\nWe'll contact you to confirm payment.`

    try {
      if (customer.phone && customer.name) {
        await sendOrQueueWhatsApp({
          number: customer.phone,
          message: lang.startsWith('en') ? msgEn : msgEs,
        }).catch((err) => {
          console.error('[Booking] WhatsApp confirmation failed:', err)
        })
      }

      // Email de confirmación al usuario (respaldo si WhatsApp falla)
      if (customer.email) {
        const subjectEs = `Confirmación de reserva ${orderNumber} - Medellín Premium`
        const subjectEn = `Booking confirmation ${orderNumber} - Medellín Premium`
        const htmlEs = `
          <h2>¡Reserva creada con éxito!</h2>
          <p>Hola <strong>${customer.name}</strong>,</p>
          <p>Tu reserva ha sido registrada en Medellín Premium.</p>
          <ul>
            <li><strong>Referencia:</strong> ${bookingRef} (${orderNumber})</li>
            <li><strong>Paquete:</strong> ${packageName}</li>
            <li><strong>Llegada:</strong> ${flight.arrivalDate || '-'} ${flight.arrivalTime || ''}</li>
            <li><strong>Vuelo:</strong> ${flight.flightNumber || '-'}</li>
            <li><strong>Destino:</strong> ${dest.address || '-'}</li>
            <li><strong>Precio:</strong> ${packagePrice.toFixed(2)} USD</li>
          </ul>
          <p>Te contactaremos por WhatsApp para confirmar el pago y los detalles de tu llegada.</p>
          <p><a href="https://www.medellinpremium.com/mis-reservas">Ver mis reservas</a></p>
        `
        const htmlEn = `
          <h2>Booking created successfully!</h2>
          <p>Hi <strong>${customer.name}</strong>,</p>
          <p>Your booking has been registered with Medellín Premium.</p>
          <ul>
            <li><strong>Reference:</strong> ${bookingRef} (${orderNumber})</li>
            <li><strong>Package:</strong> ${packageName}</li>
            <li><strong>Arrival:</strong> ${flight.arrivalDate || '-'} ${flight.arrivalTime || ''}</li>
            <li><strong>Flight:</strong> ${flight.flightNumber || '-'}</li>
            <li><strong>Destination:</strong> ${dest.address || '-'}</li>
            <li><strong>Price:</strong> ${packagePrice.toFixed(2)} USD</li>
          </ul>
          <p>We will contact you via WhatsApp to confirm payment and arrival details.</p>
          <p><a href="https://www.medellinpremium.com/mis-reservas">View my bookings</a></p>
        `
        await sendEmail({
          to: customer.email,
          subject: lang.startsWith('en') ? subjectEn : subjectEs,
          html: lang.startsWith('en') ? htmlEn : htmlEs,
          text: lang.startsWith('en') ? msgEn : msgEs,
          bookingReference: bookingRef,
        }).catch((err) => {
          console.error('[Booking] Email confirmation failed:', err)
        })
      }
    } catch (err) {
      console.error('[Booking] WhatsApp confirmation error:', err)
    }

    // 9. Emitir evento de tiempo real para admin
    await emitEvent('booking.created', {
      booking_reference: bookingRef,
      order_number: orderNumber,
      customer_name: customer.name || '',
      customer_phone: customer.phone || '',
      package_name: packageName || body.package || '',
      package_price: packagePrice,
      arrival_date: flight.arrivalDate || '',
      arrival_time: flight.arrivalTime || '',
      flight_number: flight.flightNumber || '',
      destination_address: dest.address || '',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      clerk_user_id: clerkId,
    }, { correlationId: bookingRef }).catch(() => {})

    return NextResponse.json(
      {
        status: 'success',
        message: 'Reserva creada con éxito. Te contactaremos por WhatsApp para confirmar el pago.',
        orderNumber,
        bookingReference: bookingRef,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('[Booking] Error:', err)
    return NextResponse.json(
      { status: 'error', message: 'Ocurrió un error al procesar tu reserva. Inténtalo de nuevo.' },
      { status: 500 },
    )
  }
}
