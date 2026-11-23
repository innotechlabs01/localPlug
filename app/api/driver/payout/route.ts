import { NextResponse } from 'next/server'
import { getDriverFromSession } from '@/lib/driver/auth'
import { getDb } from '@/lib/db'
import { createPayoutRequest, getDriverPayable } from '@/lib/payout'

export const dynamic = 'force-dynamic'

/** Current weekly period for driver payouts. */
function currentWeekPeriod(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Driver's payout summary: available balance, pending, and current period. */
export async function GET() {
  const result = await getDriverFromSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const payable = await getDriverPayable(result.driver.id)
  const db = getDb()
  const latest = await db.execute({
    sql: `SELECT id, period, amount_usd, status, created_at FROM payout_requests
          WHERE payee_type = 'driver' AND payee_id = ? ORDER BY id DESC LIMIT 1`,
    args: [result.driver.id],
  })
  return NextResponse.json({
    available_usd: payable.balance_usd,
    pending_usd: payable.pending_usd,
    current_period: currentWeekPeriod(),
    latest_request: latest.rows[0] ?? null,
  })
}

/** Driver requests a payout for the current (or given) weekly period. */
export async function POST(req: Request) {
  const result = await getDriverFromSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const body = await req.json().catch(() => ({}))
  const period = typeof body?.period === 'string' && body.period.trim()
    ? body.period.trim()
    : currentWeekPeriod()

  const create = await createPayoutRequest('driver', result.driver.id, period)
  if ('error' in create) return NextResponse.json({ error: create.error }, { status: 409 })
  return NextResponse.json({ success: true, requestId: create.requestId, amount_usd: create.amount_usd })
}