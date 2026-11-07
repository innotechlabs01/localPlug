import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getDb()

  // Get stored performance data
  const perf = await db.execute({
    sql: 'SELECT * FROM driver_performance WHERE driver_id = ? ORDER BY period DESC LIMIT 12',
    args: [id],
  })

  // Get driver stats from orders
  const orders = await db.execute({
    sql: `SELECT COUNT(*) as total,
          SUM(CASE WHEN dispatch_status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
          FROM orders o WHERE o.assigned_to = ?`,
    args: [id],
  })

  return NextResponse.json({
    history: perf.rows,
    summary: orders.rows[0],
  })
}
