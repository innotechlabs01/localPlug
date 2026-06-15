import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('roles', 'view')
  if (authError) return authError

  const db = getDb()
  const result = await db.execute('SELECT id, name, slug, description, icon, sort_order FROM modules ORDER BY sort_order')

  return NextResponse.json({ modules: result.rows })
}
