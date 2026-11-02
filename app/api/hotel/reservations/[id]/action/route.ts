import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { resolveHotelContext } from '@/lib/admin/hotel-auth'
import { recordHotelAudit } from '@/lib/hotel/audit'
import { emitEvent } from '@/lib/events-outbox'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Allowed hotel-initiated transitions: from -> [allowed to]
const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirm_room', 'decline_room', 'cancelled'],
  confirm_room: ['check_in', 'cancelled', 'reschedule_requested'],
  check_in: ['check_out'],
  reschedule_requested: ['confirm_room', 'cancelled'],
}

const ACTION_TO_STATUS: Record<string, string> = {
  confirm_room: 'confirmed',
  decline_room: 'cancelled',
  check_in: 'checked_in',
  check_out: 'checked_out',
  reschedule_requested: 'pending',
  room_ready: 'confirmed',
  cancelled: 'cancelled',
}

const EVENT_FOR_ACTION: Record<string, string> = {
  confirm_room: 'hotel.room_confirmed',
  decline_room: 'hotel.room_declined',
  check_in: 'hotel.guest_checked_in',
  check_out: 'hotel.guest_checked_out',
  reschedule_requested: 'hotel.reschedule_requested',
  room_ready: 'hotel.room_ready',
  cancelled: 'hotel.room_cancelled',
}

const NOTIFY_ADMIN_ACTIONS: Record<string, string> = {
  confirm_room: 'hotel_room_confirmed',
  decline_room: 'hotel_room_declined',
  check_in: 'hotel_guest_checked_in',
  check_out: 'hotel_guest_checked_out',
  reschedule_requested: 'hotel_reschedule_requested',
  room_ready: 'hotel_room_ready',
  cancelled: 'hotel_room_cancelled',
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const started = Date.now()
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error
    if (!ctx.isAdmin && !ctx.hotelId) {
      return NextResponse.json({ error: 'Forbidden: no hotel context' }, { status: 403 })
    }

    const db = getDb()

    const { id } = await params
    const orderId = Number(id)
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
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

    // Get order and verify hotel ownership
    const orderRes = await db.execute({
      sql: `SELECT o.*, r.name as room_name, r.type as room_type
            FROM orders o
            LEFT JOIN rooms r ON o.room_id = r.id
            WHERE o.id = ?`,
      args: [orderId],
    })

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderRes.rows[0] as any

    // Hotel managers can only act on their own hotel's orders
    if (!ctx.isAdmin && ctx.hotelId && order.hotel_id !== ctx.hotelId) {
      return NextResponse.json({ error: 'Forbidden: not your hotel order' }, { status: 403 })
    }

    const fromStatus = order.dispatch_status || order.status || 'pending'
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

    // Build update for orders.dispatch_status
    const newDispatchStatus = toStatus

    await db.execute({
      sql: `UPDATE orders
            SET dispatch_status = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [newDispatchStatus, orderId],
    })

    // ---- Audit log (append-only, immutable) ----
    await recordHotelAudit({
      orderId,
      hotelId: order.hotel_id,
      roomId: order.room_id ?? null,
      actorType: ctx.isAdmin ? 'admin' : 'hotel',
      actorId: clerkId ? Number(clerkId) : undefined,
      actorName: ctx.isAdmin ? 'Admin' : 'Hotel Manager',
      action: action as any,
      fromStatus,
      toStatus: newDispatchStatus,
      reason,
      metadata,
    }).catch(() => {})

    // ---- Realtime outbox so admin/dispatch see the move immediately ----
    const eventPayload = {
      order_id: orderId,
      booking_reference: order.booking_reference,
      hotel_id: order.hotel_id,
      room_id: order.room_id,
      actor_type: ctx.isAdmin ? 'admin' : 'hotel',
      actor_name: ctx.isAdmin ? 'Admin' : 'Hotel Manager',
      from: fromStatus,
      to: newDispatchStatus,
      action,
      reason,
      ...(metadata || {}),
    }
    await emitEvent(EVENT_FOR_ACTION[action], eventPayload, {
      correlationId: order.booking_reference,
    }).catch(() => {})

    // ---- Notify admin (email) on important actions ----
    if (NOTIFY_ADMIN_ACTIONS[action]) {
      try {
        // Get admin emails (simplified: fetch all admin users)
        const admins = await db.execute({
          sql: `SELECT u.email, u.name FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' AND u.status = 'active'`,
          args: [],
        })
        for (const admin of admins.rows || []) {
          await sendEmail({
            to: (admin.email as string) || '',
            subject: `Hotel acción: ${action} - Orden ${order.order_number}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0b0d14;color:#fff;border-radius:12px;padding:24px;border:1px solid #1f2937">
                <h2>Acción de Hotel - Orden ${order.order_number}</h2>
                <p><strong>Hotel:</strong> ${order.hotel_id}</p>
                <p><strong>Habitación:</strong> ${order.room_id || '—'}</p>
                <p><strong>Huésped:</strong> ${order.customer_name || '—'}</p>
                <p><strong>Acción:</strong> ${action}</p>
                <p><strong>Estado anterior:</strong> ${fromStatus}</p>
                <p><strong>Estado nuevo:</strong> ${newDispatchStatus}</p>
                ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
              </div>
            `,
            text: `Acción de hotel ${action} en orden ${order.order_number}. Estado: ${fromStatus} → ${newDispatchStatus}`,
            bookingReference: order.booking_reference,
          }).catch(() => {})
        }
      } catch {
        // Non-critical: audit + outbox already recorded
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      bookingReference: order.booking_reference,
      action,
      from: fromStatus,
      to: newDispatchStatus,
    })
  } catch (err) {
    console.error('[hotel reservation action]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    console.log('[hotel reservation action] latency_ms', Date.now() - started)
  }
}
