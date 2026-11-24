import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET(request: Request) {
  try {
    const authError = await requirePermission('support', 'view')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const db = getDb()
    const convRes = await db.execute({
      sql: 'SELECT * FROM conversations WHERE id = ? LIMIT 1',
      args: [Number(conversationId)],
    })
    if (convRes.rows.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const conv = convRes.rows[0] as any
    const email = String(conv.user_email || '').trim().toLowerCase()
    const rawPhone = String(conv.user_phone || conv.user_identifier || '').replace(/\D/g, '')
    const phoneSuffix = rawPhone.length >= 7 ? rawPhone.slice(-10) : ''

    const conditions: string[] = []
    const args: (string | number)[] = []

    if (email) {
      conditions.push('LOWER(o.customer_email) = ?')
      args.push(email)
    }
    if (phoneSuffix) {
      conditions.push("REPLACE(REPLACE(REPLACE(COALESCE(o.customer_phone, ''), '+', ''), ' ', ''), '-', '') LIKE ?")
      args.push(`%${phoneSuffix}`)
    }

    let reservations: any[] = []
    if (conditions.length > 0) {
      const ordersRes = await db.execute({
        sql: `SELECT
                o.id, o.order_number, o.booking_reference, o.customer_name, o.customer_email, o.customer_phone,
                o.package_name, o.package_price, o.currency,
                o.flight_number, o.airline, o.arrival_date, o.arrival_time, o.return_date, o.return_time,
                o.destination_address, o.status, o.dispatch_status,
                COALESCE(p.status, o.payment_status) as payment_status,
                d.name as driver_name, d.phone as driver_phone, d.vehicle as driver_vehicle, d.plate as driver_plate,
                h.name as hotel_name
              FROM orders o
              LEFT JOIN drivers d ON o.assigned_to = d.id
              LEFT JOIN hotels h ON o.hotel_id = h.id
              LEFT JOIN payments p ON o.booking_reference = p.booking_reference
              WHERE ${conditions.join(' OR ')}
              ORDER BY o.created_at DESC
              LIMIT 5`,
        args,
      })
      reservations = ordersRes.rows as any[]
    }

    return NextResponse.json({
      success: true,
      conversation: conv,
      reservations,
    })
  } catch (error) {
    console.error('[Chat Context] GET error:', error)
    return NextResponse.json({ error: 'Failed to load customer context' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const authError = await requirePermission('support', 'update')
    if (authError) return authError

    const body = await request.json()
    const { conversationId, assignedAgentId, isFlagged, status } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const db = getDb()
    const updates: string[] = ["updated_at = datetime('now')"]
    const args: (string | number | null)[] = []

    if (assignedAgentId !== undefined) {
      updates.push('assigned_agent_id = ?')
      args.push(assignedAgentId ? Number(assignedAgentId) : null)
      if (assignedAgentId) {
        updates.push("status = CASE WHEN status = 'closed' THEN 'closed' ELSE 'human_active' END")
      }
    }
    if (isFlagged !== undefined) {
      updates.push('flagged = ?')
      args.push(isFlagged ? 1 : 0)
    }
    if (status && ['ai_active', 'human_active', 'closed'].includes(status)) {
      updates.push('status = ?')
      args.push(status)
    }

    args.push(Number(conversationId))
    await db.execute({
      sql: `UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Chat Context] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}
