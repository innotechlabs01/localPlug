import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { plan_id, name, description, price_per_person_usd, is_active, sort_order } = body

  if (!plan_id || !name) {
    return NextResponse.json({ error: 'Plan ID and tour name are required' }, { status: 400 })
  }

  const db = getDb()

  const result = await db.execute({
    sql: `INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, is_active, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [plan_id, name, description || '', price_per_person_usd || 0, is_active !== false ? 1 : 0, sort_order || 0],
  })

  return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
}

export async function PUT(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { id, name, description, price_per_person_usd, is_active, sort_order } = body

  if (!id) return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 })

  const db = getDb()
  const setClauses: string[] = []
  const args: any[] = []

  if (name !== undefined) { setClauses.push('name = ?'); args.push(name) }
  if (description !== undefined) { setClauses.push('description = ?'); args.push(description) }
  if (price_per_person_usd !== undefined) { setClauses.push('price_per_person_usd = ?'); args.push(price_per_person_usd) }
  if (is_active !== undefined) { setClauses.push('is_active = ?'); args.push(is_active ? 1 : 0) }
  if (sort_order !== undefined) { setClauses.push('sort_order = ?'); args.push(sort_order) }

  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  args.push(id)
  await db.execute({ sql: `UPDATE plan_tours SET ${setClauses.join(', ')} WHERE id = ?`, args })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Tour ID is required' }, { status: 400 })

  const db = getDb()
  await db.execute({ sql: 'DELETE FROM plan_tours WHERE id = ?', args: [parseInt(id)] })

  return NextResponse.json({ success: true })
}
