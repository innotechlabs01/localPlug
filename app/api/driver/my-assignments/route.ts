import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'
import { sweepStaleRideOffers } from '@/lib/rides/offer-lifecycle'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const db = getDb()
    await sweepStaleRideOffers(db)

    const assignmentsResult = await db.execute({
      sql: `SELECT a.*, o.order_number, o.booking_reference, o.customer_name, o.customer_phone, o.customer_email,
                   o.package_name, o.flight_number, o.arrival_date, o.arrival_time,
                   o.destination_address, o.airline, o.airport_parking,
                   o.status as order_status, o.dispatch_status as order_dispatch_status
            FROM assignments a
            LEFT JOIN orders o ON a.order_id = o.id
            WHERE a.driver_id = ?
              AND NOT (
                a.status IN ('pending_acceptance', 'offered')
                AND (o.status IN ('cancelled', 'completed') OR o.dispatch_status IN ('cancelled', 'completed'))
              )
            ORDER BY a.created_at DESC
            LIMIT 50`,
      args: [result.driver.id],
    })

    return NextResponse.json({ assignments: assignmentsResult.rows })
  } catch (err) {
    console.error('[driver assignments]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
