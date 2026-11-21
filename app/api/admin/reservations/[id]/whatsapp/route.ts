import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { sendOrQueueWhatsApp } from '@/lib/n8n/client'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requirePermission('reservations', 'update')
    if (authError) return authError

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 })
    }

    const db = getDb()
    const orderResult = await db.execute({
      sql: `SELECT id, order_number, booking_reference, customer_name, customer_phone, package_name, arrival_date, arrival_time, flight_number
            FROM orders WHERE id = ?`,
      args: [id],
    })

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const order = orderResult.rows[0] as Record<string, unknown>
    const body = await req.json().catch(() => ({})) as {
      phone?: string
      guestName?: string
      message?: string
    }

    const phone = (body.phone || (order.customer_phone as string) || '').trim()
    if (!phone) {
      return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 })
    }

    const guestName = body.guestName || (order.customer_name as string) || 'Guest'
    const ref = (order.order_number as string) || (order.booking_reference as string) || `#${id}`
    const defaultMessage = `Hola ${guestName}, te contactamos de Medellín Travel respecto a tu reserva ${ref}${order.arrival_date ? ` (${order.arrival_date}${order.arrival_time ? ` ${order.arrival_time}` : ''})` : ''}.`
    const message = (body.message || defaultMessage).trim()

    const result = await sendOrQueueWhatsApp({
      number: phone,
      message,
    })

    return NextResponse.json({
      success: true,
      sent: result.success,
      queued: !result.success,
      error: result.error,
    })
  } catch (err) {
    console.error('[Admin Reservations WhatsApp]', err)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}
