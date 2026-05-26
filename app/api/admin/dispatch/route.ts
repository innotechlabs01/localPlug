import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// ── GET /api/admin/dispatch ──
// Query params: status, priority, search, tab (all|pending|assigned|enroute|vip)
// Returns: { orders: [...], drivers: [...], counts: { pending, assigned, enroute } }
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const { searchParams } = new URL(req.url)

  const tab = searchParams.get('tab') || 'all'
  const search = searchParams.get('search') || ''
  const driverCat = searchParams.get('driverCat') || 'all'

  // ── Build orders query ──
  let sql = `SELECT o.*, d.name as driver_name, d.vehicle as driver_vehicle,
             COALESCE(p.status, o.payment_status) as payment_status
             FROM orders o
             LEFT JOIN drivers d ON o.assigned_to = d.id
             LEFT JOIN payments p ON o.booking_reference = p.booking_reference
             WHERE 1=1`
  const args: (string | number)[] = []

  if (tab === 'pending') {
    sql += ' AND o.dispatch_status = ?'
    args.push('pending')
  } else if (tab === 'assigned') {
    sql += ' AND o.dispatch_status = ?'
    args.push('assigned')
  } else if (tab === 'enroute') {
    sql += ' AND o.dispatch_status = ?'
    args.push('enroute')
  } else if (tab === 'completed') {
    sql += ' AND o.dispatch_status = ?'
    args.push('completed')
  } else if (tab === 'vip') {
    sql += ' AND (o.priority = ? OR o.priority = ?)'
    args.push('high', 'urgent')
  }

  if (search) {
    sql += ' AND (o.customer_name LIKE ? OR o.order_number LIKE ? OR o.flight_number LIKE ? OR o.destination_address LIKE ?)'
    const term = `%${search}%`
    args.push(term, term, term, term)
  }

  sql += ' ORDER BY o.created_at DESC LIMIT 50'

  const ordersResult = await db.execute({ sql, args })

  // ── Build drivers query ──
  let driverSql = 'SELECT * FROM drivers WHERE 1=1'
  const driverArgs: (string | number)[] = []

  if (driverCat !== 'all') {
    driverSql += ' AND category = ?'
    driverArgs.push(driverCat)
  }

  driverSql += ' ORDER BY status ASC, rating DESC'

  const driversResult = await db.execute({ sql: driverSql, args: driverArgs })

  // ── Counts ──
  const countsResult = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'pending' OR dispatch_status IS NULL) as pending,
      (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'assigned') as assigned,
      (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'enroute') as enroute,
      (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'pickedup') as pickedup
  `)

  const counts = countsResult.rows[0] as unknown as { pending: number; assigned: number; enroute: number; pickedup: number }

  return NextResponse.json({
    orders: ordersResult.rows,
    drivers: driversResult.rows,
    counts: counts || { pending: 0, assigned: 0, enroute: 0, pickedup: 0 },
  })
}

// ── PUT /api/admin/dispatch ──
// Body: { action: 'assign' | 'unassign' | 'status', ... }
export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const body = await req.json()
  const { action } = body

  if (action === 'assign') {
    const { orderId, driverId } = body
    if (!orderId || !driverId) {
      return NextResponse.json({ error: 'orderId and driverId required' }, { status: 400 })
    }

    const driver = await db.execute({
      sql: 'SELECT * FROM drivers WHERE id = ?',
      args: [driverId],
    })
    if (!driver.rows.length) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    const order = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId],
    })
    if (!order.rows.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await db.execute({
      sql: `UPDATE orders SET assigned_to = ?, dispatch_status = 'assigned', assigned_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      args: [driverId, orderId],
    })

    await db.execute({
      sql: `UPDATE drivers SET status = 'busy', updated_at = datetime('now') WHERE id = ?`,
      args: [driverId],
    })

    return NextResponse.json({ success: true, action: 'assigned' })
  }

  if (action === 'unassign') {
    const { orderId } = body
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const order = await db.execute({
      sql: 'SELECT assigned_to FROM orders WHERE id = ?',
      args: [orderId],
    })
    if (!order.rows.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const driverId = order.rows[0].assigned_to as number | null
    if (driverId) {
      await db.execute({
        sql: `UPDATE drivers SET status = 'available', updated_at = datetime('now') WHERE id = ?`,
        args: [driverId],
      })
    }

    await db.execute({
      sql: `UPDATE orders SET assigned_to = NULL, dispatch_status = 'pending', assigned_at = NULL, updated_at = datetime('now') WHERE id = ?`,
      args: [orderId],
    })

    return NextResponse.json({ success: true, action: 'unassigned' })
  }

  if (action === 'status') {
    const { orderId, status } = body
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'assigned', 'enroute', 'pickedup', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await db.execute({
      sql: `UPDATE orders SET dispatch_status = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [status, orderId],
    })

    // If completed, free the driver
    if (status === 'completed') {
      const order = await db.execute({
        sql: 'SELECT assigned_to FROM orders WHERE id = ?',
        args: [orderId],
      })
      const driverId = order.rows[0]?.assigned_to as number | null
      if (driverId) {
        await db.execute({
          sql: `UPDATE drivers SET status = 'available', updated_at = datetime('now') WHERE id = ?`,
          args: [driverId],
        })
      }
    }

    return NextResponse.json({ success: true, action: 'status_updated', newStatus: status })
  }

  return NextResponse.json({ error: 'Unknown action. Use: assign, unassign, status' }, { status: 400 })
}
