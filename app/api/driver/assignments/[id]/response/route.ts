import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { recordAudit } from '@/lib/driver/audit'
import { emitEvent } from '@/lib/events-outbox'
import { sendBookingNotification } from '@/lib/notifications/booking'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Resolve driver profile from clerk_user_id
    const driverRes = await db.execute({
      sql: `SELECT id, name, phone, email FROM drivers WHERE clerk_user_id = ?`,
      args: [clerkId],
    })

    if (driverRes.rows.length === 0) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 })
    }

    const driverId = Number(driverRes.rows[0].id)
    const driverName = driverRes.rows[0].name as string
    const driverPhone = driverRes.rows[0].phone as string | null

    const assignmentId = Number(params.id)
    if (Number.isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 })
    }

    // Verify the assignment belongs to this driver
    const assignmentRes = await db.execute({
      sql: `SELECT a.id, a.order_id, a.status, a.driver_id, o.order_number, o.booking_reference,
                 o.customer_name, o.destination_address, o.arrival_date, o.arrival_time
            FROM assignments a
            JOIN orders o ON a.order_id = o.id
            WHERE a.id = ? AND a.driver_id = ?`,
      args: [assignmentId, driverId],
    })

    if (assignmentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found or not assigned to you' }, { status: 404 })
    }

    const assignment = assignmentRes.rows[0] as any

    if (assignment.status !== 'pending_acceptance') {
      return NextResponse.json({ error: `Assignment already ${assignment.status}` }, { status: 409 })
    }

    const body = await req.json()
    const { action, reason } = body

    if (action === 'accept') {
      await db.execute({
        sql: `UPDATE assignments SET status = 'accepted', accepted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        args: [assignmentId],
      })

      // Update order dispatch status
      await db.execute({
        sql: `UPDATE orders SET dispatch_status = 'assigned', updated_at = datetime('now') WHERE id = ?`,
        args: [assignment.order_id],
      })

      // Audit log — driver accepted
      await recordAudit({
        assignmentId,
        orderId: assignment.order_id,
        driverId,
        actorType: 'driver',
        actorId: clerkId ? Number(clerkId) : undefined,
        actorName: driverName,
        action: 'accepted',
        fromStatus: assignment.status,
        toStatus: 'accepted',
      }).catch(() => {})

      // Realtime event for admin/dispatch
      await emitEvent('driver.assignment_accepted', {
        assignment_id: assignmentId,
        order_id: assignment.order_id,
        driver_id: driverId,
        driver_name: driverName,
        from: assignment.status,
        to: 'accepted',
      }, { correlationId: String(assignmentId) }).catch(() => {})

      // Notify customer that a driver has been assigned
      try {
        const { sendBookingNotification } = await import('@/lib/notifications/booking')
        const customerPhoneRes = await db.execute({
          sql: `SELECT customer_phone, customer_email, customer_name, customer_language FROM orders WHERE id = ?`,
          args: [assignment.order_id],
        })
        if (customerPhoneRes.rows.length > 0) {
          const cust = customerPhoneRes.rows[0] as any
          await sendBookingNotification({
            bookingReference: assignment.booking_reference,
            orderNumber: assignment.order_number,
            customerName: cust.customer_name || 'Huésped',
            customerEmail: cust.customer_email,
            customerPhone: cust.customer_phone,
            customerLanguage: cust.customer_language || 'es',
            packageName: '', // will be filled by template if empty
            packagePrice: 0,
            event: 'driver_assigned',
            driverName,
            driverPhone: driverPhone || undefined,
          }).catch(() => {})
        }
      } catch {
        // Non-critical
      }

      return NextResponse.json({ success: true, action: 'accepted', assignmentId })
    }

    if (action === 'reject') {
      await db.execute({
        sql: `UPDATE assignments SET status = 'rejected', updated_at = datetime('now') WHERE id = ?`,
        args: [assignmentId],
      })

      // Audit log — driver declined
      await recordAudit({
        assignmentId,
        orderId: assignment.order_id,
        driverId,
        actorType: 'driver',
        actorId: clerkId ? Number(clerkId) : undefined,
        actorName: driverName,
        action: 'declined',
        fromStatus: assignment.status,
        toStatus: 'rejected',
        reason,
      }).catch(() => {})

      await emitEvent('driver.assignment_declined', {
        assignment_id: assignmentId,
        order_id: assignment.order_id,
        driver_id: driverId,
        driver_name: driverName,
        from: assignment.status,
        to: 'rejected',
        reason,
      }, { correlationId: String(assignmentId) }).catch(() => {})

      return NextResponse.json({ success: true, action: 'rejected', assignmentId })
    }

    return NextResponse.json({ error: 'Invalid action. Use "accept" or "reject"' }, { status: 400 })
  } catch (error) {
    console.error('[Driver Assignment Response] PUT error:', error)
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 })
  }
}
