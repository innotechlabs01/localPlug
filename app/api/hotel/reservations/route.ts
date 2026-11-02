import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { resolveHotelContext } from '@/lib/admin/hotel-auth'

export async function GET(req: Request) {
  try {
    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error
    if (!ctx.isAdmin && !ctx.hotelId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const limit = Number(searchParams.get('limit') || '50')

    let sql = `
      SELECT
        o.id, o.order_number, o.booking_reference, o.customer_name, o.customer_email,
        o.customer_phone, o.customer_country, o.customer_language, o.customer_notes,
        o.package_id, o.package_name, o.package_price, o.currency,
        o.flight_number, o.airline, o.arrival_date, o.arrival_time,
        o.return_date, o.return_time,
        o.destination_address, o.additional_trips, o.traveler_profile, o.num_people,
        o.hotel_id, o.room_id, o.num_nights, o.is_hotel_booking, o.hotel_commission_rate,
        o.status, o.dispatch_status,
        COALESCE(p.status, o.payment_status) as payment_status,
        o.payment_id, o.priority, o.internal_notes,
        o.assigned_to, o.assigned_at,
        o.created_at, o.updated_at,
        d.name as driver_name, d.phone as driver_phone,
        r.name as room_name, r.type as room_type, r.price_per_night
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_to = d.id
      LEFT JOIN payments p ON o.booking_reference = p.booking_reference
      LEFT JOIN rooms r ON o.room_id = r.id
      WHERE o.is_hotel_booking = 1
    `
    const args: (string | number)[] = []

    // Hotel managers see only their hotel
    if (!ctx.isAdmin && ctx.hotelId) {
      sql += ' AND o.hotel_id = ?'
      args.push(ctx.hotelId)
    }

    if (status && status !== 'all') {
      sql += ' AND o.status = ?'
      args.push(status)
    }

    if (search) {
      sql += ' AND (o.customer_name LIKE ? OR o.order_number LIKE ? OR o.booking_reference LIKE ?)'
      const term = `%${search}%`
      args.push(term, term, term)
    }

    sql += ' ORDER BY o.arrival_date ASC, o.arrival_time ASC LIMIT ?'
    args.push(limit)

    const result = await db.execute({ sql, args })

    const reservations = (result.rows || []).map((row: any) => ({
      id: String(row.id),
      orderNumber: row.order_number,
      bookingReference: row.booking_reference,
      guest: {
        name: row.customer_name || 'Unknown',
        email: row.customer_email || '',
        phone: row.customer_phone || '',
        country: row.customer_country || 'N/A',
        language: row.customer_language || 'Not specified',
        notes: row.customer_notes || '',
      },
      service: {
        id: row.package_id || '',
        name: row.package_name || 'Standard Package',
        price: row.package_price || 0,
        currency: row.currency || 'USD',
      },
      arrivalDate: row.arrival_date || '',
      arrivalTime: row.arrival_time || '',
      returnDate: row.return_date || '',
      returnTime: row.return_time || '',
      flightInfo: row.flight_number && row.airline
        ? `${row.airline} ${row.flight_number} — ${row.arrival_time || ''}`
        : row.flight_number || 'Not provided',
      destinationAddress: row.destination_address || '',
      additionalTrips: row.additional_trips
        ? (typeof row.additional_trips === 'string' ? JSON.parse(row.additional_trips) : row.additional_trips)
        : [],
      travelerProfile: row.traveler_profile || '',
      numPeople: row.num_people || 1,
      hotel: {
        id: row.hotel_id,
        roomId: row.room_id,
        numNights: row.num_nights || 0,
        isHotelBooking: row.is_hotel_booking || 0,
        commissionRate: row.hotel_commission_rate || 0,
        roomName: row.room_name,
        roomType: row.room_type,
        pricePerNight: row.price_per_night || 0,
      },
      status: row.status || 'pending',
      paymentStatus: row.payment_status || 'pending',
      dispatchStatus: row.dispatch_status || 'pending',
      driver: row.assigned_to
        ? { id: row.assigned_to, name: row.driver_name || 'Unknown', phone: row.driver_phone || '' }
        : null,
      internalNotes: row.internal_notes || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
    }))

    return NextResponse.json({ reservations, total: reservations.length })
  } catch (error) {
    console.error('[Hotel Reservations API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch hotel reservations' }, { status: 500 })
  }
}
