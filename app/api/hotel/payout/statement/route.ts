import { NextResponse } from 'next/server'
import { getHotelFromSession } from '@/lib/hotel/auth'
import { getPayoutStatement, statementToCsv, listPayoutPeriods } from '@/lib/payout'
import { statementToPdf } from '@/lib/payout-receipt'

export const dynamic = 'force-dynamic'

function currentMonthPeriod(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/** GET /api/hotel/payout/statement?period=YYYY-MM&format=csv|pdf|json */
export async function GET(req: Request) {
  const result = await getHotelFromSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const hotelId = result.hotel.id

  const url = new URL(req.url)
  const availablePeriods = await listPayoutPeriods('hotel', hotelId)
  const period = url.searchParams.get('period')?.trim() || availablePeriods[0] || currentMonthPeriod()
  const format = url.searchParams.get('format') || 'json'

  const stmt = await getPayoutStatement('hotel', hotelId, period)

  if (format === 'csv') {
    return new NextResponse(statementToCsv(stmt), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hotel-statement-${period}.csv"`,
      },
    })
  }
  if (format === 'pdf') {
    const buf = await statementToPdf(stmt, { payeeType: 'hotel', payeeName: result.hotel.name })
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="hotel-statement-${period}.pdf"`,
      },
    })
  }
  return NextResponse.json({ statement: stmt, availablePeriods })
}