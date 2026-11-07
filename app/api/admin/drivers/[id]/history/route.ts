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

  // Get driver info
  const driver = await db.execute({
    sql: 'SELECT * FROM drivers WHERE id = ?',
    args: [id],
  })
  if (driver.rows.length === 0) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
  }

  // Get order assignments for this driver
  const orders = await db.execute({
    sql: `SELECT id, order_number, customer_name, dispatch_status, assigned_at, updated_at, created_at
          FROM orders WHERE assigned_to = ? ORDER BY assigned_at DESC`,
    args: [id],
  })

  // Build timeline
  const d = driver.rows[0] as any
  const timeline = []

  timeline.push({
    type: 'created',
    title: 'Driver registered',
    description: `${d.name} was added to the system`,
    timestamp: d.created_at,
  })

  if (d.status === 'available') {
    timeline.push({
      type: 'status',
      title: 'Available for dispatch',
      description: 'Driver is ready for assignments',
      timestamp: d.updated_at,
    })
  }

  for (const order of (orders.rows || []) as any[]) {
    const label = order.dispatch_status === 'assigned' ? 'Assigned to order'
      : order.dispatch_status === 'enroute' ? 'En route to pickup'
      : order.dispatch_status === 'pickedup' ? 'Guest picked up'
      : order.dispatch_status === 'completed' ? 'Trip completed'
      : 'Order update'
    timeline.push({
      type: 'order',
      title: label,
      description: `Order #${order.order_number || order.id} — ${order.customer_name || 'Guest'}`,
      timestamp: order.assigned_at || order.updated_at,
      orderId: order.id,
    })
  }

  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({ timeline, totalOrders: orders.rows.length })
}
