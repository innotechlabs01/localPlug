import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `
        SELECT 
          o.id,
          o.order_number,
          o.booking_reference,
          o.package_id,
          o.package_name,
          o.package_price,
          o.currency,
          o.status,
          o.payment_status,
          o.dispatch_status,
          o.arrival_date,
          o.arrival_time,
          o.flight_number,
          o.airline,
          o.return_date,
          o.return_time,
          o.destination_address,
          o.destination_has_place,
          o.additional_trips,
          o.traveler_profile,
          o.num_people,
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          o.customer_country,
          o.customer_language,
          o.hotel_id,
          o.room_id,
          o.num_nights,
          o.is_hotel_booking,
          o.created_at,
          o.updated_at,
          p.amount as payment_amount,
          p.method as payment_method,
          p.transaction_id as payment_transaction_id
        FROM orders o
        LEFT JOIN payments p ON o.booking_reference = p.booking_reference
        WHERE o.clerk_user_id = ?
        ORDER BY datetime(o.created_at) DESC
      `,
      args: [userId],
    })

    return NextResponse.json({ bookings: result.rows })
  } catch (err) {
    console.error('[GET /api/me/bookings]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
