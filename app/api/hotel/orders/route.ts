import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    const db = getDb()
    let sql = `SELECT * FROM orders WHERE 1=1`
    const args: any[] = []

    if (status) {
      sql += ` AND status = ?`
      args.push(status)
    }

    if (date) {
      sql += ` AND arrival_date = ?`
      args.push(date)
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`

    const result = await db.execute({ sql, args })

    return NextResponse.json({ orders: result.rows })
  } catch (err) {
    console.error('[hotel orders]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
