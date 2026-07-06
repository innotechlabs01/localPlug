import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { checkDriverAvailability, getEstimatedDurationMinutes } from '@/lib/dispatch/availability'
import { triggerDriverNewAssignment } from '@/lib/n8n/client'

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('dispatch', 'update')
    if (authError) return authError

    const db = getDb()
    const body = await req.json()
    const { orderId, driverId, serviceType, pickupDate, pickupTime, estimatedDuration, observations, isDropoff } = body

    if (!orderId || !driverId || !pickupDate || !pickupTime) {
      return NextResponse.json({ error: 'orderId, driverId, pickupDate, and pickupTime are required' }, { status: 400 })
    }

    const orderResult = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId],
    })
    if (!orderResult.rows.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    const order = orderResult.rows[0]

    const driverResult = await db.execute({
      sql: 'SELECT * FROM drivers WHERE id = ?',
      args: [driverId],
    })
    if (!driverResult.rows.length) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }
    const driver = driverResult.rows[0]

    const existingAssignment = await db.execute({
      sql: "SELECT id FROM assignments WHERE order_id = ? AND status IN ('pending_acceptance', 'accepted', 'confirmed_to_client')",
      args: [orderId],
    })
    if (existingAssignment.rows.length > 0) {
      return NextResponse.json({ error: 'Order already has an active assignment' }, { status: 409 })
    }

    const dropoff = isDropoff || serviceType === 'dropoff' || serviceType === 'return'
    const durationMinutes = estimatedDuration
      ? parseInt(estimatedDuration, 10) || getEstimatedDurationMinutes(order.package_name as string || '', dropoff)
      : getEstimatedDurationMinutes(order.package_name as string || '', dropoff)

    const availability = await checkDriverAvailability({
      driverId,
      pickupDate,
      pickupTime,
      estimatedDurationMinutes: durationMinutes,
      isDropoff: dropoff,
    })

    if (!availability.available) {
      return NextResponse.json({
        error: 'Driver not available at this time',
        conflicts: availability.conflicts,
      }, { status: 409 })
    }

    const durationStr = estimatedDuration || `${durationMinutes}min`

    const result = await db.execute({
      sql: `INSERT INTO assignments (order_id, driver_id, status, service_type, pickup_location, destination, pickup_date, pickup_time, estimated_duration, observations, notified_driver_at, created_at, updated_at)
            VALUES (?, ?, 'pending_acceptance', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      args: [
        orderId,
        driverId,
        serviceType || 'pickup',
        order.destination_address as string || pickupDate,
        (order.destination_address as string) || '',
        pickupDate || (order.arrival_date as string),
        pickupTime || (order.arrival_time as string),
        durationStr,
        observations || (order.customer_notes as string) || '',
      ],
    })

    const assignmentId = Number(result.lastInsertRowid)

    await db.execute({
      sql: "UPDATE orders SET dispatch_status = 'pending_acceptance', updated_at = datetime('now') WHERE id = ?",
      args: [orderId],
    })

    try {
      const clientPhone = order.customer_phone as string
      const driverPhone = driver.phone as string

      triggerDriverNewAssignment({
        assignmentId,
        orderId,
        bookingReference: order.booking_reference as string,
        customerName: order.customer_name as string,
        customerPhone: clientPhone || undefined,
        driverId,
        driverName: driver.name as string,
        driverPhone: driverPhone || undefined,
        vehiclePlate: driver.plate as string,
        vehicleBrand: driver.vehicle as string,
        serviceType: serviceType || 'pickup',
        pickupLocation: order.destination_address as string || '',
        destination: (order.destination_address as string) || '',
        pickupDate: pickupDate || (order.arrival_date as string),
        pickupTime: pickupTime || (order.arrival_time as string),
        estimatedDuration: durationStr,
        observations: observations || '',
      }).catch(err => console.error('[Assignments] n8n trigger failed:', err))
    } catch (n8nErr) {
      console.error('[Assignments] Failed to send n8n notification:', n8nErr)
    }

    return NextResponse.json({
      success: true,
      assignmentId,
      status: 'pending_acceptance',
      availabilityCheck: {
        available: true,
        conflictsChecked: availability.conflicts.length,
      },
    }, { status: 201 })
  } catch (err) {
    console.error('[assignments POST]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('dispatch', 'view')
    if (authError) return authError

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const driverId = searchParams.get('driverId')

    let sql = `
      SELECT a.*, o.order_number, o.booking_reference, o.customer_name, o.customer_phone,
             o.flight_number, o.package_name, o.arrival_date, o.arrival_time,
             d.name as driver_name, d.vehicle, d.plate, d.phone as driver_phone
      FROM assignments a
      LEFT JOIN orders o ON a.order_id = o.id
      LEFT JOIN drivers d ON a.driver_id = d.id
      WHERE 1=1
    `
    const args: (string | number)[] = []

    if (status) {
      sql += ' AND a.status = ?'
      args.push(status)
    }
    if (driverId) {
      sql += ' AND a.driver_id = ?'
      args.push(Number(driverId))
    }

    sql += ' ORDER BY a.created_at DESC LIMIT 100'

    const result = await db.execute({ sql, args })
    return NextResponse.json({ assignments: result.rows })
  } catch (err) {
    console.error('[assignments GET]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
