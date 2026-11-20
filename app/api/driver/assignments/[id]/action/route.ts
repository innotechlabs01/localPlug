import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'
import { recordAudit } from '@/lib/driver/audit'
import { accrueDriverPayout } from '@/lib/payout'
import { emitEvent } from '@/lib/events-outbox'

export const dynamic = 'force-dynamic'

// Allowed driver-initiated transitions: from -> [allowed to]
const TRANSITIONS: Record<string, string[]> = {
  pending_acceptance: ['accepted', 'declined', 'cancelled'],
  accepted: ['en_route', 'in_progress', 'completed', 'cancelled', 'pending_acceptance'],
  confirmed_to_client: ['en_route', 'in_progress', 'completed', 'cancelled', 'pending_acceptance'],
  en_route: ['in_progress', 'completed', 'cancelled', 'pending_acceptance'],
  in_progress: ['completed', 'cancelled'],
}

const ACTION_TO_STATUS: Record<string, string> = {
  accept: 'accepted',
  decline: 'declined',
  en_route: 'en_route',
  pickedup: 'in_progress',
  complete: 'completed',
  cancel: 'cancelled',
  reschedule_request: 'pending_acceptance',
}

const EVENT_FOR_ACTION: Record<string, string> = {
  accept: 'driver.assignment_accepted',
  decline: 'driver.assignment_declined',
  en_route: 'driver.en_route',
  pickedup: 'trip.pickedup',
  complete: 'driver.trip_completed',
  cancel: 'driver.trip_cancelled',
  reschedule_request: 'driver.reschedule_requested',
}

const NOTIFY_CUSTOMER_ACTIONS: Record<string, string> = {
  accept: 'driver_assigned',
  decline: 'driver_declined',
  en_route: 'driver_en_route',
  pickedup: 'driver_pickedup',
  complete: 'trip_completed',
  cancel: 'trip_cancelled',
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const started = Date.now()
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const driverId = result.driver.id
    const driverName = result.driver.name
    const driverPhone = result.driver.phone
    const clerkId = result.clerkId

    const { id } = await params
    const assignmentId = Number(id)
    if (Number.isNaN(assignmentId)) {
      return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 })
    }

    let body: { action?: string; reason?: string; metadata?: Record<string, unknown> }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { action, reason, metadata } = body
    if (!action || !ACTION_TO_STATUS[action]) {
      return NextResponse.json(
        { error: `action is required. Allowed: ${Object.keys(ACTION_TO_STATUS).join(', ')}` },
        { status: 400 },
      )
    }

    const db = getDb()

    const existing = await db.execute({
      sql: `SELECT a.id, a.status, a.order_id, o.dispatch_status, o.customer_name,
                 o.customer_email, o.customer_phone, o.customer_language,
                 o.package_name, o.package_price, o.currency, o.order_number,
                 o.booking_reference, o.arrival_date, o.arrival_time,
                 o.destination_address
            FROM assignments a
            JOIN orders o ON a.order_id = o.id
            WHERE a.id = ? AND a.driver_id = ?`,
      args: [assignmentId, driverId],
    })

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Assignment not found or not yours' }, { status: 404 })
    }

    const row = existing.rows[0] as any
    const fromStatus = row.status as string
    const orderId = Number(row.order_id)
    const toStatus = ACTION_TO_STATUS[action]

    // Validate transition
    const allowed = TRANSITIONS[fromStatus] || []
    if (!allowed.includes(toStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition '${fromStatus}' -> '${toStatus}'`,
          from: fromStatus,
          allowed,
        },
        { status: 409 },
      )
    }

    // Special: reschedule_request keeps assignment pending_acceptance for re-offer
    const updateStatus = action === 'reschedule_request' ? 'pending_acceptance' : toStatus
    const airportParking = Boolean(metadata?.airport_parking)
    const proofUrl = typeof metadata?.parking_proof_url === 'string' && metadata.parking_proof_url.trim()
      ? metadata.parking_proof_url.trim()
      : null

    const assignmentExtras =
      updateStatus === 'completed'
        ? `, completed_at = datetime('now'), block_until = NULL`
        : updateStatus === 'declined'
          ? `, driver_declined_at = datetime('now'), decline_reason = ?, block_until = NULL`
          : updateStatus === 'accepted'
            ? `, driver_accepted_at = datetime('now')`
            : updateStatus === 'en_route'
              ? `, en_route_at = datetime('now')`
              : updateStatus === 'in_progress'
                ? `, in_progress_at = datetime('now')`
                : ''

    const assignmentArgs =
      updateStatus === 'declined'
        ? [updateStatus, reason || '', assignmentId, driverId, fromStatus]
        : [updateStatus, assignmentId, driverId, fromStatus]

    const updateRes = await db.execute({
      sql: `UPDATE assignments
            SET status = ?${assignmentExtras}, updated_at = datetime('now')
            WHERE id = ? AND driver_id = ? AND status = ?`,
      args: assignmentArgs,
    })

    if (updateRes.rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Assignment state changed concurrently, please refresh' },
        { status: 409 },
      )
    }

    // Mirror to orders.dispatch_status and handle milestone side-effects
    if (updateStatus === 'completed') {
      await db.batch([
        {
          sql: `UPDATE orders
                SET airport_parking = ?, parking_proof_url = ?, parking_proof_status = ?,
                    dispatch_status = 'completed', updated_at = datetime('now')
                WHERE id = ?`,
          args: [airportParking ? 1 : 0, proofUrl, airportParking ? 'pending' : 'approved', orderId],
        },
        {
          sql: `UPDATE drivers SET status = 'available', updated_at = datetime('now') WHERE id = ?`,
          args: [driverId],
        },
      ])

      await accrueDriverPayout(orderId, driverId).catch(err => {
        console.error('[driver action] payout accrual failed:', err)
      })

      if (airportParking) {
        emitEvent('parking_proof.submitted', { order_id: orderId, driver_id: driverId, status: 'pending' }, { correlationId: String(orderId) }).catch(() => {})
      }
    } else if (updateStatus === 'declined') {
      await db.execute({
        sql: `UPDATE orders SET dispatch_status = 'pending', assigned_to = NULL, assigned_at = NULL, updated_at = datetime('now') WHERE id = ?`,
        args: [orderId],
      })
    } else {
      const orderDispatch = updateStatus === 'accepted' ? 'assigned' : updateStatus
      await db.execute({
        sql: `UPDATE orders
              SET dispatch_status = ?, updated_at = datetime('now')
              WHERE id = ?`,
        args: [orderDispatch, orderId],
      })
      if (updateStatus === 'accepted') {
        await db.execute({
          sql: `UPDATE drivers SET status = 'busy', updated_at = datetime('now') WHERE id = ?`,
          args: [driverId],
        })
      }
    }

    // ---- Audit log (append-only, immutable) ----
    await recordAudit({
      assignmentId,
      orderId,
      driverId,
      actorType: 'driver',
      actorName: driverName,
      action: action as any,
      fromStatus,
      toStatus: updateStatus,
      reason,
      metadata,
    }).catch(() => {})

    // ---- Realtime outbox so admin/dispatch see the move immediately ----
    const eventPayload = {
      assignment_id: assignmentId,
      order_id: orderId,
      driver_id: driverId,
      driver_name: driverName,
      from: fromStatus,
      to: updateStatus,
      action,
      reason,
      ...(metadata || {}),
    }
    await emitEvent(EVENT_FOR_ACTION[action], eventPayload, {
      correlationId: String(assignmentId),
    }).catch(() => {})

    // ---- Notify customer (WhatsApp + email, queued if provider down) ----
    const customerEvent = NOTIFY_CUSTOMER_ACTIONS[action]
    if (customerEvent) {
      try {
        const { sendBookingNotification } = await import('@/lib/notifications/booking')
        await sendBookingNotification({
          bookingReference: row.booking_reference,
          orderNumber: row.order_number,
          customerName: row.customer_name || 'Huésped',
          customerEmail: row.customer_email,
          customerPhone: row.customer_phone,
          customerLanguage: row.customer_language || 'es',
          packageName: row.package_name || '',
          packagePrice: Number(row.package_price || 0),
          event: customerEvent as any,
          driverName,
          driverPhone: driverPhone || undefined,
        }).catch(() => {})
      } catch {
        // Non-critical: audit + outbox already recorded
      }
    }

    return NextResponse.json({
      success: true,
      assignmentId,
      action,
      from: fromStatus,
      to: updateStatus,
    })
  } catch (err) {
    console.error('[driver assignment action]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    console.log('[driver assignment action] latency_ms', Date.now() - started)
  }
}
