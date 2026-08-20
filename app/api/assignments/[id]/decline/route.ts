import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireWebhookAuth } from '@/lib/webhook-auth'
import { getDriverFromSession } from '@/lib/driver/auth'
import { sendOrQueueWhatsApp } from '@/lib/n8n/client'
import { logger } from '@/lib/logger'

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

    const assignmentResult = await db.execute({
      sql: 'SELECT * FROM assignments WHERE id = ?',
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

    let declineReason = ''
    try {
      const body = await req.json()
      declineReason = body.reason || body.declineReason || ''
    } catch {
      // no body is fine
    }

    const now = new Date().toISOString()

    await db.execute({
      sql: `UPDATE assignments
            SET status = 'declined', driver_declined_at = ?, decline_reason = ?, block_until = NULL, updated_at = ?
            WHERE id = ?`,
      args: [now, declineReason, now, assignmentId],
    })

    await db.execute({
      sql: "UPDATE orders SET dispatch_status = 'pending', assigned_to = NULL, assigned_at = NULL, updated_at = ? WHERE id = ?",
      args: [now, assignment.order_id],
    })

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

    return NextResponse.json({
      success: true,
      assignmentId,
      status: 'declined',
      declinedAt: now,
    })
  } catch (err) {
    console.error('[assignments decline POST]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
