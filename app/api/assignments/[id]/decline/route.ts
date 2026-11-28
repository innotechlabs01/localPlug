import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireWebhookAuth } from '@/lib/webhook-auth'
import { getDriverFromSession } from '@/lib/driver/auth'
import { sendOrQueueWhatsApp } from '@/lib/n8n/client'
import { logger } from '@/lib/logger'
import { emitEvent } from '@/lib/events-outbox'
import { isStaleOffer, sweepStaleRideOffers, type OfferState } from '@/lib/rides/offer-lifecycle'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authError = requireWebhookAuth(req)
    let driverSession: { driver: { id: number }; clerkId: string } | null = null
    if (authError) {
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
    await sweepStaleRideOffers()

    const assignmentResult = await db.execute({
      sql: `SELECT a.*, o.status as order_status, o.dispatch_status, o.assigned_to, o.package_id,
                   o.booking_reference, o.customer_phone, o.customer_name
            FROM assignments a
            LEFT JOIN orders o ON a.order_id = o.id
            WHERE a.id = ?`,
      args: [assignmentId],
    })

    if (!assignmentResult.rows.length) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const assignment = assignmentResult.rows[0]

    if (driverSession && assignment.driver_id !== driverSession.driver.id) {
      return NextResponse.json({ error: 'Not your assignment' }, { status: 403 })
    }

    if (assignment.status !== 'pending_acceptance') {
      return NextResponse.json({
        error: `Assignment cannot be declined. Current status: ${assignment.status}`,
        status: assignment.status,
      }, { status: 409 })
    }

    // Never let a late response cancel a ride that is already closed or handed
    // to another driver. The rider's status poll expires the stale offer.
    if (isStaleOffer(assignment as unknown as OfferState)) {
      return NextResponse.json({ error: 'Offer expired', status: 'expired' }, { status: 409 })
    }

    let declineReason = ''
    try {
      const body = await req.json()
      declineReason = body.reason || body.declineReason || ''
    } catch {
      // no body is fine
    }

    const now = new Date().toISOString()

    const batchRes = await db.batch([
      {
        sql: `UPDATE assignments
              SET status = 'declined', driver_declined_at = ?, decline_reason = ?, block_until = NULL, updated_at = ?
              WHERE id = ? AND status = 'pending_acceptance'`,
        args: [now, declineReason, now, assignmentId],
      },
      {
        sql: `UPDATE orders
              SET dispatch_status = 'pending', assigned_to = NULL, assigned_at = NULL, updated_at = ?
              WHERE id = ?
                AND assigned_to = ?
                AND dispatch_status IN ('pending_acceptance', 'assigned')
                AND status NOT IN ('cancelled', 'completed')`,
        args: [now, assignment.order_id, assignment.driver_id],
      },
    ])

    if (batchRes[0].rowsAffected === 0) {
      return NextResponse.json({
        error: 'Assignment was already accepted or declined.',
      }, { status: 409 })
    }

    // Notify customer that driver declined — we're finding a new one
    try {
      const orderResult = await db.execute({
        sql: 'SELECT customer_phone, customer_name, booking_reference FROM orders WHERE id = ?',
        args: [assignment.order_id],
      })
      const order = orderResult.rows[0] as { customer_phone?: string; customer_name?: string; booking_reference?: string } | undefined
      if (order?.customer_phone) {
        const isSpanish = /[áéíóúñ¿¡]/.test(order.customer_name || '')
        const msg = isSpanish
          ? `⚠️ Hola ${order.customer_name || 'viajero'}, tu conductor declinó la asignación. Estamos buscando una alternativa para tu reserva #${(order.booking_reference || '').slice(0, 8).toUpperCase()}. Te notificaremos pronto.`
          : `⚠️ Hello ${order.customer_name || 'traveler'}, your driver declined the assignment. We're finding an alternative for your booking #${(order.booking_reference || '').slice(0, 8).toUpperCase()}. We'll notify you soon.`
        sendOrQueueWhatsApp({ number: order.customer_phone, message: msg }).catch(err =>
          logger.error('[Assignment Decline] WhatsApp notification failed', err instanceof Error ? err : undefined)
        )
      }
    } catch (err) {
      logger.error('[Assignment Decline] Failed to send notification', err instanceof Error ? err : undefined)
    }

    // Realtime outbox — driver declined; dispatch needs to re-assign.
    emitEvent('assignments.declined', {
      assignment_id: assignmentId,
      order_id: assignment.order_id as number,
      driver_id: assignment.driver_id as number,
      reason: declineReason,
      status: 'declined',
    }, { correlationId: String(assignmentId) }).catch(() => {})

    return NextResponse.json({
      success: true,
      assignmentId,
      status: 'declined',
      declinedAt: now,
    })
  } catch (err) {
    console.error('[assignments decline POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
