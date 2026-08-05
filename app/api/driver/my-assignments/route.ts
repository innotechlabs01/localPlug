import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const db = getDb()
    const assignmentsResult = await db.execute({
      sql: `SELECT a.*, o.order_number, o.booking_reference, o.customer_name, o.customer_phone, o.customer_email,
                   o.package_name, o.flight_number, o.arrival_date, o.arrival_time,
                   o.destination_address, o.airline, o.airport_parking
            FROM assignments a
            LEFT JOIN orders o ON a.order_id = o.id
            WHERE a.driver_id = ?
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
