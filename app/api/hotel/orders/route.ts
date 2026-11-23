import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getHotelFromSession } from '@/lib/hotel/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const db = getDb()
    let sql = `SELECT * FROM orders WHERE hotel_id = ?`
    const args: any[] = [result.hotel.id]

    if (status) {
      sql += ` AND status = ?`
      args.push(status)
    }

    if (date) {
      sql += ` AND arrival_date = ?`
      args.push(date)
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`

    const ordersResult = await db.execute({ sql, args })

    return NextResponse.json({ orders: ordersResult.rows })
  } catch (err) {
    console.error('[hotel orders]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
