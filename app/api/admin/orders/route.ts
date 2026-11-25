import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET(req: Request) {
  const authError = await requirePermission('reservations', 'view')
  if (authError) return authError
  const db = getDb()
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')

  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100', 10) || 100))
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0)

  let sql = `SELECT o.*, COALESCE(p.status, o.payment_status) as payment_status
             FROM orders o
             LEFT JOIN payments p ON o.booking_reference = p.booking_reference
             WHERE 1=1`
  const args: (string | number)[] = []

  if (status && status !== 'all') {
    sql += ' AND o.status = ?'
    args.push(status)
  }

  if (priority && priority !== 'all') {
    sql += ' AND o.priority = ?'
    args.push(priority)
  }

  if (search) {
    sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)'
    const term = `%${search}%`
    args.push(term, term, term)
  }

  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
  args.push(limit, offset)

  const result = await db.execute({ sql, args })

  return NextResponse.json(result.rows)
}
