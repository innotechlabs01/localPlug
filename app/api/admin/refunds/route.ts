import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  const db = getDb()
  const where = status ? 'WHERE status = ?' : ''
  const result = await db.execute({
    sql: `SELECT * FROM refunds_disputes ${where} ORDER BY created_at DESC LIMIT 200`,
    args: status ? [status] : [],
  })
  // Totals for the dashboard
  const totals = await db.execute({
    sql: `SELECT resolution, COUNT(*) AS count, COALESCE(SUM(amount_usd), 0) AS total
          FROM refunds_disputes GROUP BY resolution`,
    args: [],
  })
  return NextResponse.json({ refunds: result.rows, totals: totals.rows })
}