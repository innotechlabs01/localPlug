import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import { listPayoutRequests } from '@/lib/payout'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const payee_type = searchParams.get('payee_type') || undefined

  const requests = await listPayoutRequests({ status, payee_type })

  // Summary counts for the settlement dashboard
  const db = (await import('@/lib/db')).getDb()
  const counts = await db.execute({
    sql: `SELECT status, COUNT(*) AS count FROM payout_requests GROUP BY status`,
    args: [],
  })

  return NextResponse.json({ requests, counts: counts.rows })
}