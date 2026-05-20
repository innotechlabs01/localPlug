import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: Request) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

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
