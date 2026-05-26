import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getToday } from '@/lib/date-utils'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || getToday()

  const result = await db.execute({
    sql: `SELECT
      id,
      order_number,
      customer_name,
      package_name,
      flight_number,
      airline,
      arrival_date,
      arrival_time,
      status,
      priority,
      created_at
    FROM orders
    WHERE arrival_date = ?
    ORDER BY arrival_time ASC`,
    args: [date],
  })

  const activities = result.rows.map((row) => ({
    id: row.id,
    title: row.flight_number
      ? `Airport Pickup - ${row.flight_number}`
      : `Order ${row.order_number}`,
    time: row.arrival_time || '00:00',
    type: row.flight_number ? 'arrival' : 'task',
    customer: row.customer_name,
    status: row.status === 'completed' ? 'completed' : 'pending',
    order_number: row.order_number,
  }))

  return NextResponse.json(activities)
}
