import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()

  // Get order with driver info
  const orderResult = await db.execute({
    sql: `SELECT o.*, d.name as driver_name, d.phone as driver_phone, d.vehicle as driver_vehicle, d.plate as driver_plate
          FROM orders o 
          LEFT JOIN drivers d ON o.assigned_to = d.id 
          WHERE o.id = ?`,
    args: [id],
  })

  if (orderResult.rows.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const order = orderResult.rows[0]

  // Get status history from order timeline if exists
  const history = []
  
  // Build timeline from existing timestamps
  if (order.created_at) {
    history.push({
      status: 'created',
      timestamp: order.created_at,
      description: 'Order created'
    })
  }
  if (order.assigned_at && order.assigned_to) {
    history.push({
      status: 'assigned',
      timestamp: order.assigned_at,
      description: `Driver ${order.driver_name} assigned`
    })
  }
  if (order.dispatch_status === 'enroute') {
    history.push({
      status: 'enroute',
      timestamp: order.updated_at,
      description: 'Driver en route to pickup'
    })
  }
  if (order.dispatch_status === 'pickedup') {
    history.push({
      status: 'pickedup',
      timestamp: order.updated_at,
      description: 'Guest picked up'
    })
  }
  if (order.dispatch_status === 'completed') {
    history.push({
      status: 'completed',
      timestamp: order.updated_at,
      description: 'Service completed'
    })
  }
  if (order.status === 'cancelled') {
    history.push({
      status: 'cancelled',
      timestamp: order.updated_at,
      description: 'Order cancelled'
    })
  }

  return NextResponse.json({ ...order, history })
}
