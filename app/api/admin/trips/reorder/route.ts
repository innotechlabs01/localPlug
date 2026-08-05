import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('trips', 'update')
    if (authError) return authError

    const body = await req.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds is required' }, { status: 400 })
    }

    const db = getDb()

    for (let i = 0; i < orderedIds.length; i++) {
      await db.execute({
        sql: 'UPDATE trips SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?',
        args: [i, orderedIds[i]],
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Trips Reorder API] error:', error)
    return NextResponse.json({ error: 'Failed to reorder trips' }, { status: 500 })
  }
}