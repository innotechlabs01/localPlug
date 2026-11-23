import { NextResponse } from 'next/server'
import { getDriverFromSession } from '@/lib/driver/auth'
import { getPayoutStatement, statementToCsv, listPayoutPeriods } from '@/lib/payout'
import { statementToPdf } from '@/lib/payout-receipt'

export const dynamic = 'force-dynamic'

function currentWeekPeriod(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** GET /api/driver/payout/statement?period=YYYY-Www&format=csv|pdf|json */
export async function GET(req: Request) {
  const result = await getDriverFromSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const driverId = result.driver.id

  const url = new URL(req.url)
  const availablePeriods = await listPayoutPeriods('driver', driverId)
  const period = url.searchParams.get('period')?.trim() || availablePeriods[0] || currentWeekPeriod()
  const format = url.searchParams.get('format') || 'json'

  const stmt = await getPayoutStatement('driver', driverId, period)

  if (format === 'csv') {
    return new NextResponse(statementToCsv(stmt), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="driver-statement-${period}.csv"`,
      },
    })
  }
  if (format === 'pdf') {
    const buf = await statementToPdf(stmt, { payeeType: 'driver', payeeName: result.driver.name })
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="driver-statement-${period}.pdf"`,
      },
    })
  }
  return NextResponse.json({ statement: stmt, availablePeriods })
}