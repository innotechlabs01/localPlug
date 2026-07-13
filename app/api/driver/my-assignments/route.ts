import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const driverId = searchParams.get('driverId')

    if (!driverId) {
      return NextResponse.json({ error: 'driverId required' }, { status: 400 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `SELECT a.*, o.order_number, o.booking_reference, o.customer_name, o.customer_phone,
                   o.customer_email, o.package_name, o.flight_number, o.arrival_date, o.arrival_time,
                   o.destination_address, o.airline
            FROM assignments a
            LEFT JOIN orders o ON a.order_id = o.id
            WHERE a.driver_id = ?
            ORDER BY a.created_at DESC
            LIMIT 50`,
      args: [Number(driverId)],
    })

    return NextResponse.json({ assignments: result.rows })
  } catch (err) {
    console.error('[driver assignments]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
