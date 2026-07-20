import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireWebhookAuth } from '@/lib/webhook-auth'
import { triggerClientDriverConfirmed } from '@/lib/n8n/client'
import { getEstimatedDurationMinutes } from '@/lib/dispatch/availability'
import { getDriverFromSession } from '@/lib/driver/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Allow webhook auth OR Clerk session auth
    const authError = requireWebhookAuth(req)
    let driverSession: { driver: { id: number }; clerkId: string } | null = null
    if (authError) {
      // Try Clerk session
      const driverResult = await getDriverFromSession()
      if ('error' in driverResult) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      driverSession = driverResult
    }

    const { id } = await params
    const assignmentId = Number(id)
    if (isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 })
    }

    const db = getDb()

    const assignmentResult = await db.execute({
      sql: `SELECT a.*, o.order_number, o.booking_reference, o.customer_name, o.customer_phone,
                   o.customer_email, o.package_name, o.flight_number, o.arrival_date, o.arrival_time,
                   o.destination_address, o.status as order_status,
                   d.name as driver_name, d.vehicle, d.plate, d.phone as driver_phone, d.photo_url
            FROM assignments a
            LEFT JOIN orders o ON a.order_id = o.id
            LEFT JOIN drivers d ON a.driver_id = d.id
            WHERE a.id = ?`,
      args: [assignmentId],
    })

    if (!assignmentResult.rows.length) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const assignment = assignmentResult.rows[0]

    // If Clerk session (driver), verify they own this assignment
    if (driverSession && assignment.driver_id !== driverSession.driver.id) {
      return NextResponse.json({ error: 'Not your assignment' }, { status: 403 })
    }

    if (assignment.status !== 'pending_acceptance') {
      return NextResponse.json({
        error: `Assignment cannot be accepted. Current status: ${assignment.status}`,
        status: assignment.status,
      }, { status: 409 })
    }

    const now = new Date().toISOString()
    const durationMinutes = getEstimatedDurationMinutes(
      (assignment.package_name as string) || '',
      assignment.service_type === 'dropoff' || assignment.service_type === 'return',
    )

    const pickupDate = assignment.pickup_date as string
    const pickupTime = assignment.pickup_time as string
    const blockMinutes = assignment.service_type === 'dropoff' || assignment.service_type === 'return'
      ? 120
      : Math.max((parseInt((assignment.estimated_duration as string) || '60', 10) || durationMinutes) + 30, 90)

    const d = new Date(`${pickupDate}T${String(pickupTime).padStart(5, '0')}:00`)
    d.setMinutes(d.getMinutes() + blockMinutes)
    const blockUntil = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

    await db.execute({
      sql: `UPDATE assignments
            SET status = 'accepted', driver_accepted_at = ?, block_until = ?, updated_at = ?
            WHERE id = ?`,
      args: [now, blockUntil, now, assignmentId],
    })

    await db.execute({
      sql: `UPDATE orders
            SET assigned_to = ?, dispatch_status = 'assigned', assigned_at = ?, updated_at = ?
            WHERE id = ?`,
      args: [assignment.driver_id, now, now, assignment.order_id],
    })

    await db.execute({
      sql: "UPDATE drivers SET status = 'busy', updated_at = ? WHERE id = ?",
      args: [now, assignment.driver_id],
    })

    try {
      triggerClientDriverConfirmed({
        assignmentId,
        orderId: assignment.order_id as number,
        bookingReference: assignment.booking_reference as string,
        customerName: assignment.customer_name as string,
        customerPhone: (assignment.customer_phone as string) || undefined,
        driverName: assignment.driver_name as string,
        driverPhone: (assignment.driver_phone as string) || undefined,
        driverPhoto: (assignment.photo_url as string) || undefined,
        vehiclePlate: assignment.plate as string,
        vehicleBrand: assignment.vehicle as string,
        pickupDate,
        pickupTime,
        pickupLocation: assignment.pickup_location as string || '',
        destination: assignment.destination as string || '',
      }).catch(err => console.error('[Assignments] Client confirm trigger failed:', err))
    } catch (n8nErr) {
      console.error('[Assignments] Failed to send client confirmation:', n8nErr)
    }

    return NextResponse.json({
      success: true,
      assignmentId,
      status: 'accepted',
      acceptedAt: now,
    })
  } catch (err) {
    console.error('[assignments accept POST]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
