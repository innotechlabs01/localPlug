import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Resolve driver profile from clerk_user_id
    const driverRes = await db.execute({
      sql: `SELECT id, name, phone, status, vehicle, plate, category FROM drivers WHERE clerk_user_id = ?`,
      args: [clerkId],
    })

    if (driverRes.rows.length === 0) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 })
    }

    const driverId = Number(driverRes.rows[0].id)

    const { searchParams } = new URL('') // placeholder, no search needed
    const statusFilter = '' // no filter for now

    const sql = `
      SELECT
        a.id, a.order_id, a.driver_id, a.status, a.pickup_date, a.pickup_time,
        a.block_until, a.accepted_at, a.completed_at, a.notes as assignment_notes,
        o.order_number, o.booking_reference, o.customer_name, o.customer_phone,
        o.customer_email, o.package_name, o.package_price, o.currency,
        o.arrival_date, o.arrival_time, o.return_date, o.return_time,
        o.flight_number, o.airline, o.destination_address, o.num_people,
        o.return_trip, o.special_requests, o.status as order_status,
        h.name as hotel_name, r.name as room_name
      FROM assignments a
      JOIN orders o ON a.order_id = o.id
      LEFT JOIN hotels h ON o.hotel_id = h.id
      LEFT JOIN rooms r ON o.room_id = r.id
      WHERE a.driver_id = ?
        AND a.status IN ('pending_acceptance', 'accepted', 'confirmed_to_client', 'enroute', 'pickedup')
      ORDER BY
        CASE a.status
          WHEN 'pending_acceptance' THEN 1
          WHEN 'accepted' THEN 2
          WHEN 'confirmed_to_client' THEN 3
          WHEN 'enroute' THEN 4
          WHEN 'pickedup' THEN 5
          ELSE 6
        END,
        a.pickup_date ASC, a.pickup_time ASC
    `

    const result = await db.execute({ sql, args: [driverId] })

    const assignments = (result.rows || []).map((row: any) => ({
      id: String(row.id),
      orderId: Number(row.order_id),
      orderNumber: row.order_number,
      bookingReference: row.booking_reference,
      status: row.status,
      pickupDate: row.pickup_date || '',
      pickupTime: row.pickup_time || '',
      blockUntil: row.block_until || '',
      acceptedAt: row.accepted_at || '',
      completedAt: row.completed_at || '',
      assignmentNotes: row.assignment_notes || '',
      customer: {
        name: row.customer_name || 'Unknown',
        phone: row.customer_phone || '',
        email: row.customer_email || '',
      },
      service: {
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
      numPeople: row.num_people || 1,
      returnTrip: row.return_trip ? 1 : 0,
      specialRequests: row.special_requests || '',
      orderStatus: row.order_status || 'pending',
      hotel: row.hotel_name ? { name: row.hotel_name, roomName: row.room_name || '' } : null,
    }))

    return NextResponse.json({ driverId, driverName: driverRes.rows[0].name, assignments, total: assignments.length })
  } catch (error) {
    console.error('[Driver Pending Assignments] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
