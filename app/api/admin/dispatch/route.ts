import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { triggerDriverAssigned, triggerDriverNewAssignment } from '@/lib/n8n/client'
import { checkDriverAvailability, getEstimatedDurationMinutes } from '@/lib/dispatch/availability'

// ── GET /api/admin/dispatch ──
// Query params: status, priority, search, tab (all|pending|assigned|enroute|vip)
// Returns: { orders: [...], drivers: [...], counts: { pending, assigned, enroute } }
export async function GET(req: Request) {
  try {
    const authError = await requirePermission('dispatch', 'view')
    if (authError) return authError
    const db = getDb()
    const { searchParams } = new URL(req.url)

    const tab = searchParams.get('tab') || 'all'
    const search = searchParams.get('search') || ''
    const driverCat = searchParams.get('driverCat') || 'all'

    let sql = `SELECT o.*, d.name as driver_name, d.vehicle as driver_vehicle,
               COALESCE(p.status, o.payment_status) as payment_status
                FROM orders o
                LEFT JOIN drivers d ON o.assigned_to = d.id
                LEFT JOIN payments p ON o.booking_reference = p.booking_reference
                WHERE 1=1`
    const args: (string | number)[] = []

    if (tab === 'cancelled') {
      sql += " AND o.status = 'cancelled'"
    } else {
      sql += " AND (o.status IS NULL OR o.status != 'cancelled')"
    }

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

    let driverSql = `SELECT * FROM drivers WHERE status IN ('available', 'active')`
    const driverArgs: (string | number)[] = []

    if (driverCat !== 'all') {
      driverSql += ' AND category = ?'
      driverArgs.push(driverCat)
    }

    driverSql += ' ORDER BY status ASC, rating DESC'

    const driversResult = await db.execute({ sql: driverSql, args: driverArgs })

    const countsResult = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE (dispatch_status = 'pending' OR dispatch_status IS NULL) AND (status IS NULL OR status != 'cancelled')) as pending,
        (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'assigned' AND (status IS NULL OR status != 'cancelled')) as assigned,
        (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'enroute' AND (status IS NULL OR status != 'cancelled')) as enroute,
        (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'pickedup' AND (status IS NULL OR status != 'cancelled')) as pickedup,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled
    `)

    const counts = countsResult.rows[0] as unknown as { pending: number; assigned: number; enroute: number; pickedup: number }

    return NextResponse.json({
      orders: ordersResult.rows,
      drivers: driversResult.rows,
      counts: counts || { pending: 0, assigned: 0, enroute: 0, pickedup: 0 },
    })
  } catch (err) {
    console.error('[dispatch GET]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}

// ── PUT /api/admin/dispatch ──
// Body: { action: 'assign' | 'unassign' | 'status', ... }
export async function PUT(req: Request) {
  try {
  const authError = await requirePermission('dispatch', 'update')
  if (authError) return authError
  const db = getDb()
  const body = await req.json()
  const { action } = body

  if (action === 'assign') {
    const { orderId, driverId, pickupDate, pickupTime, isDropoff } = body
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
    const driverData = driver.rows[0]

    const order = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId],
    })
    if (!order.rows.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    const orderData = order.rows[0]

    const existingAssignment = await db.execute({
      sql: "SELECT id FROM assignments WHERE order_id = ? AND status IN ('pending_acceptance', 'accepted', 'confirmed_to_client')",
      args: [orderId],
    })
    if (existingAssignment.rows.length > 0) {
      return NextResponse.json({ error: 'Order already has an active assignment' }, { status: 409 })
    }

    const dropoff = isDropoff || false
    const pDate = pickupDate || (orderData.arrival_date as string) || ''
    const pTime = pickupTime || (orderData.arrival_time as string) || ''
    const durationMinutes = getEstimatedDurationMinutes(orderData.package_name as string || '', dropoff)

    if (pDate && pTime) {
      const availability = await checkDriverAvailability({
        driverId,
        pickupDate: pDate,
        pickupTime: pTime,
        estimatedDurationMinutes: durationMinutes,
        isDropoff: dropoff,
      })

      if (!availability.available) {
        return NextResponse.json({
          error: 'Driver not available at this time',
          conflicts: availability.conflicts,
        }, { status: 409 })
      }
    }

    const durationStr = `${durationMinutes}min`

    const assignmentResult = await db.execute({
      sql: `INSERT INTO assignments (order_id, driver_id, status, service_type, pickup_location, destination, pickup_date, pickup_time, estimated_duration, observations, notified_driver_at, created_at, updated_at)
            VALUES (?, ?, 'pending_acceptance', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      args: [
        orderId,
        driverId,
        dropoff ? 'dropoff' : 'pickup',
        orderData.destination_address as string || '',
        (orderData.destination_address as string) || '',
        pDate,
        pTime,
        durationStr,
        (orderData.customer_notes as string) || '',
      ],
    })

    const assignmentId = Number(assignmentResult.lastInsertRowid)

await db.execute({
        sql: "UPDATE orders SET dispatch_status = 'assigned', updated_at = datetime('now') WHERE id = ?",
        args: [orderId],
      })

    try {
      triggerDriverNewAssignment({
        assignmentId,
        orderId,
        bookingReference: orderData.booking_reference as string,
        customerName: orderData.customer_name as string,
        customerPhone: (orderData.customer_phone as string) || undefined,
        driverId,
        driverName: driverData.name as string,
        driverPhone: (driverData.phone as string) || undefined,
        vehiclePlate: driverData.plate as string,
        vehicleBrand: driverData.vehicle as string,
        serviceType: dropoff ? 'dropoff' : 'pickup',
        pickupLocation: (orderData.destination_address as string) || '',
        destination: (orderData.destination_address as string) || '',
        pickupDate: pDate,
        pickupTime: pTime,
        estimatedDuration: durationStr,
        observations: (orderData.customer_notes as string) || '',
      }).catch(err => console.error('[Dispatch] n8n trigger failed:', err))
    } catch (n8nErr) {
      console.error('[Dispatch] Failed to prepare n8n trigger:', n8nErr)
    }

    return NextResponse.json({ success: true, action: 'assigned', assignmentId, status: 'pending_acceptance' })
  }

  if (action === 'unassign') {
    const { orderId } = body
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const order = await db.execute({
      sql: 'SELECT assigned_to, dispatch_status FROM orders WHERE id = ?',
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

    await db.execute({
      sql: "UPDATE assignments SET status = 'cancelled', cancelled_at = datetime('now'), block_until = NULL, updated_at = datetime('now') WHERE order_id = ? AND status IN ('pending_acceptance', 'accepted')",
      args: [orderId],
    })

    return NextResponse.json({ success: true, action: 'unassigned' })
  }

  if (action === 'status') {
    const { orderId, status } = body
    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'assigned', 'enroute', 'pickedup', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (status === 'cancelled') {
      const orderRow = await db.execute({
        sql: 'SELECT room_id, is_hotel_booking, hotel_id FROM orders WHERE id = ?',
        args: [orderId],
      })
      const roomId = orderRow.rows[0]?.room_id as number | null
      const isHotelBooking = Number(orderRow.rows[0]?.is_hotel_booking) === 1

      await db.execute({
        sql: `UPDATE orders SET status = 'cancelled', dispatch_status = 'cancelled', updated_at = datetime('now') WHERE id = ?`,
        args: [orderId],
      })

      if (isHotelBooking && roomId) {
        await db.execute({
          sql: `UPDATE rooms SET status = 'available', available_from = datetime('now'), current_order_id = NULL, updated_at = datetime('now') WHERE id = ?`,
          args: [roomId],
        })
        await db.execute({
          sql: `UPDATE room_bookings SET status = 'cancelled', updated_at = datetime('now') WHERE order_id = ?`,
          args: [orderId],
        })
      }

      await db.execute({
        sql: "UPDATE assignments SET status = 'cancelled', cancelled_at = datetime('now'), block_until = NULL, updated_at = datetime('now') WHERE order_id = ? AND status IN ('pending_acceptance', 'accepted', 'confirmed_to_client', 'en_route')",
        args: [orderId],
      })

      return NextResponse.json({ success: true, action: 'status_updated', newStatus: status })
    }

    await db.execute({
      sql: `UPDATE orders SET dispatch_status = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [status, orderId],
    })

    if (status === 'enroute') {
      await db.execute({
        sql: "UPDATE assignments SET status = 'en_route', en_route_at = datetime('now'), updated_at = datetime('now') WHERE order_id = ? AND status IN ('accepted', 'confirmed_to_client')",
        args: [orderId],
      })
    }

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
      await db.execute({
        sql: "UPDATE assignments SET status = 'completed', completed_at = datetime('now'), block_until = NULL, updated_at = datetime('now') WHERE order_id = ? AND status IN ('accepted', 'confirmed_to_client', 'en_route')",
        args: [orderId],
      })
    }

    return NextResponse.json({ success: true, action: 'status_updated', newStatus: status })
  }

  return NextResponse.json({ error: 'Unknown action. Use: assign, unassign, status' }, { status: 400 })
  } catch (err) {
    console.error('[dispatch PUT]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
