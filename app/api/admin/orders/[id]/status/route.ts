import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission('reservations', 'update')
  if (authError) return authError
  const { id } = await params
  const db = getDb()
  const body = await req.json()
  const { status, changedBy, notes } = body

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 })
  }

  const validStatuses = ['new', 'confirmed', 'in_progress', 'on_hold', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const current = await db.execute({
    sql: 'SELECT status FROM orders WHERE id = ?',
    args: [id],
  })

  if (current.rows.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const oldStatus = current.rows[0].status as string

  await db.execute({
    sql: `UPDATE orders SET status = ?, status_changed_at = datetime('now'), status_changed_by = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [status, changedBy || null, id],
  })

  await db.execute({
    sql: `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?)`,
    args: [id, oldStatus, status, changedBy || null, notes || null],
  })

  return NextResponse.json({ success: true, oldStatus, newStatus: status })
}
