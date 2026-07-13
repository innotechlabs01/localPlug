import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { plan_id, text, sort_order } = body

  if (!plan_id || !text) {
    return NextResponse.json({ error: 'Plan ID and feature text are required' }, { status: 400 })
  }

  const db = getDb()

  const result = await db.execute({
    sql: 'INSERT INTO plan_features (plan_id, text, sort_order) VALUES (?, ?, ?)',
    args: [plan_id, text, sort_order || 0],
  })

  return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
}

export async function PUT(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { id, text, sort_order } = body

  if (!id) return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 })

  const db = getDb()
  const setClauses: string[] = []
  const args: any[] = []

  if (text !== undefined) { setClauses.push('text = ?'); args.push(text) }
  if (sort_order !== undefined) { setClauses.push('sort_order = ?'); args.push(sort_order) }

  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  args.push(id)
  await db.execute({ sql: `UPDATE plan_features SET ${setClauses.join(', ')} WHERE id = ?`, args })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 })

  const db = getDb()
  await db.execute({ sql: 'DELETE FROM plan_features WHERE id = ?', args: [parseInt(id)] })

  return NextResponse.json({ success: true })
}
