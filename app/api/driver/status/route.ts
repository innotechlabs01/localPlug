import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDriverFromSession } from '@/lib/driver/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request) {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await req.json()
    const { status } = body

    if (status !== 'available' && status !== 'inactive') {
      return NextResponse.json({ error: 'Status must be "available" or "inactive"' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `UPDATE drivers SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [status, result.driver.id],
    })

    console.log(`[Driver Status] ${result.driver.name} → ${status}`)
    return NextResponse.json({ success: true, status })
  } catch (err) {
    console.error('[Driver Status]', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
