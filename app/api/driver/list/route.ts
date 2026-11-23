import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authError = await requirePermission('dispatch', 'view')
    if (authError) return authError

    const db = getDb()
    const result = await db.execute({
      sql: `SELECT id, name, phone, vehicle, plate, status, photo_url FROM drivers ORDER BY name ASC`,
      args: [],
    })

    return NextResponse.json({ drivers: result.rows })
  } catch (err) {
    console.error('[driver list]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
