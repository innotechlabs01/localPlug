import { NextResponse } from 'next/server'
import { getHotelFromSession } from '@/lib/hotel/auth'
import { getDb } from '@/lib/db'
import { createPayoutRequest, getHotelPayable } from '@/lib/payout'

export const dynamic = 'force-dynamic'

/** Current monthly period for hotel payouts. */
function currentMonthPeriod(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function GET() {
  const result = await getHotelFromSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const payable = await getHotelPayable(result.hotel.id)
  const db = getDb()
  const latest = await db.execute({
    sql: `SELECT id, period, amount_usd, status, created_at FROM payout_requests
          WHERE payee_type = 'hotel' AND payee_id = ? ORDER BY id DESC LIMIT 1`,
    args: [result.hotel.id],
  })
  return NextResponse.json({
    available_usd: payable.balance_usd,
    pending_usd: payable.pending_usd,
    current_period: currentMonthPeriod(),
    latest_request: latest.rows[0] ?? null,
  })
}

export async function POST(req: Request) {
  const result = await getHotelFromSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const body = await req.json().catch(() => ({}))
  const period = typeof body?.period === 'string' && body.period.trim()
    ? body.period.trim()
    : currentMonthPeriod()

  const create = await createPayoutRequest('hotel', result.hotel.id, period)
  if ('error' in create) return NextResponse.json({ error: create.error }, { status: 409 })
  return NextResponse.json({ success: true, requestId: create.requestId, amount_usd: create.amount_usd })
}