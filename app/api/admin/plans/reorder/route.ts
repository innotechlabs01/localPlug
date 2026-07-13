import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { orderedIds } = body

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 })
  }

  const db = getDb()

  for (let i = 0; i < orderedIds.length; i++) {
    await db.execute({
      sql: 'UPDATE plans SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [i + 1, orderedIds[i]],
    })
  }

  return NextResponse.json({ success: true })
}
