import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { sendEmail } from '@/lib/email'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePermission('reservations', 'view')
    if (authError) return authError

    const db = getDb()
    const id = params.id

    const orderRes = await db.execute({
      sql: `
        SELECT 
          o.*,
          d.name as driver_name, d.phone as driver_phone, d.status as driver_status,
          h.name as hotel_name, h.address as hotel_address,
          r.name as room_name, r.type as room_type, r.price_per_night, r.status as room_status,
          COALESCE(p.status, o.payment_status) as payment_status_live,
          p.amount as payment_amount, p.currency as payment_currency, p.method as payment_method, p.transaction_id as payment_txn
        FROM orders o
        LEFT JOIN drivers d ON o.assigned_to = d.id
        LEFT JOIN hotels h ON o.hotel_id = h.id
        LEFT JOIN rooms r ON o.room_id = r.id
        LEFT JOIN payments p ON o.booking_reference = p.booking_reference
        WHERE o.id = ?
      `,
      args: [id]
    })

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const order = orderRes.rows[0] as any
    const bookingRef = order.booking_reference

    const [consentsRes, roomBookingsRes] = await Promise.all([
      db.execute({ sql: `SELECT * FROM consent_records WHERE booking_reference = ? ORDER BY accepted_at DESC`, args: [bookingRef] }),
      db.execute({ sql: `SELECT * FROM room_bookings WHERE order_id = ?`, args: [id] })
    ])

    return NextResponse.json({
      order,
      consents: consentsRes.rows || [],
      roomBookings: roomBookingsRes.rows || []
    })
  } catch (error) {
    console.error('[Admin Reservation Detail] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePermission('reservations', 'update')
    if (authError) return authError

    const db = getDb()
    const id = params.id
    const body = await req.json()
    const { status, payment_status, dispatch_status, internal_notes, assigned_to } = body

    const updates: string[] = []
    const args: any[] = []

    if (status !== undefined) { updates.push('status = ?'); args.push(status) }
    if (payment_status !== undefined) { updates.push('payment_status = ?'); args.push(payment_status) }
    if (dispatch_status !== undefined) { updates.push('dispatch_status = ?'); args.push(dispatch_status) }
    if (internal_notes !== undefined) { updates.push('internal_notes = ?'); args.push(internal_notes) }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); args.push(assigned_to) }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push("updated_at = datetime('now')")
    args.push(id)

    const orderRes = await db.execute({ sql: `SELECT * FROM orders WHERE id = ?`, args: [id] })
    const order = orderRes.rows[0] as any

    await db.execute({ sql: `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, args })

    // Notify customer on status/payment/dispatch change
    try {
      const { sendOrQueueWhatsApp } = await import('@/lib/n8n/client')
      if (order?.customer_phone) {
        const ref = order.order_number || order.booking_reference || id
        let msg = ''
        if (status !== undefined && status !== order.status) {
          const map: Record<string, string> = {
            confirmed: 'confirmada',
            assigned: 'asignada a conductor',
            in_progress: 'en camino/proceso',
            completed: 'completada',
            cancelled: 'cancelada',
          }
          msg = `Tu reserva ${ref} cambio a: ${map[status] || status}. Revisa detalles en /mis-reservas.`
        } else if (payment_status !== undefined && payment_status !== order.payment_status) {
          const map: Record<string, string> = {
            paid: 'pagada',
            partial: 'pago parcial registrado',
            refunded: 'reembolsada',
          }
          msg = `Tu reserva ${ref}: estado de pago ${map[payment_status] || payment_status}.`
        } else if (dispatch_status !== undefined && dispatch_status !== order.dispatch_status) {
          msg = `Tu reserva ${ref}: estado de despacho ${dispatch_status}.`
        }
        if (msg) {
          await sendOrQueueWhatsApp({ number: order.customer_phone, message: msg }).catch(() => {})
          if (order.customer_email) {
            const lang = (order.customer_language_code || order.customer_language || 'es').toLowerCase()
            const subjectEs = `Actualización de tu reserva ${ref} - Medellín Premium`
            const subjectEn = `Booking update ${ref} - Medellín Premium`
            const html = `
              <h2>Actualización de reserva</h2>
              <p>Hola <strong>${order.customer_name}</strong>,</p>
              <p>${msg.replace(/\n/g, '<br>')}</p>
              <p><a href="https://www.medellinpremium.com/mis-reservas">Ver mis reservas</a></p>
            `
            await sendEmail({
              to: order.customer_email,
              subject: lang.startsWith('en') ? subjectEn : subjectEs,
              html,
              text: msg,
              bookingReference: ref,
            }).catch(() => {})
          }
        }
      }
    } catch (e) { console.error('[Admin PUT notify]', e) }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Reservation Detail] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 })
  }
}
