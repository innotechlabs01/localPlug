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

  let sql = `SELECT o.*, COALESCE(p.status, o.payment_status) as payment_status
             FROM orders o
             LEFT JOIN payments p ON o.booking_reference = p.booking_reference
             WHERE 1=1`
  const args: string[] = []

  if (status && status !== 'all') {
    sql += ' AND status = ?'
    args.push(status)
  }

  if (priority && priority !== 'all') {
    sql += ' AND priority = ?'
    args.push(priority)
  }

  if (search) {
    sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)'
    const term = `%${search}%`
    args.push(term, term, term)
  }

  sql += ' ORDER BY created_at DESC'

  const result = await db.execute({ sql, args })

  return NextResponse.json(result.rows)
}
