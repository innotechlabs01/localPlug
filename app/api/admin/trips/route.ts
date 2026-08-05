import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  try {
    const authError = await requirePermission('trips', 'view')
    if (authError) return authError

    const db = getDb()

    const result = await db.execute({
      sql: 'SELECT * FROM trips WHERE is_active = 1 ORDER BY sort_order ASC',
      args: [],
    })

    return NextResponse.json({ trips: result.rows || [] })
  } catch (error) {
    console.error('[Trips API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('trips', 'create')
    if (authError) return authError

    const body = await req.json()
    const { name, slug, description, price_per_person_usd, is_active, sort_order } = body

    if (!name) {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const db = getDb()

    const existing = await db.execute({ sql: 'SELECT id FROM trips WHERE slug = ?', args: [finalSlug] })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A trip with this slug already exists' }, { status: 409 })
    }

    const result = await db.execute({
      sql: `INSERT INTO trips (name, slug, description, price_per_person_usd, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        name, finalSlug, description || '', price_per_person_usd || 0,
        is_active !== false ? 1 : 0, sort_order || 0,
      ],
    })

    return NextResponse.json({ success: true, id: result.lastInsertRowid, slug: finalSlug })
  } catch (error) {
    console.error('[Trips API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('trips', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, name, slug, description, price_per_person_usd, is_active, sort_order } = body

    if (!id) return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })

    const db = getDb()
    const setClauses: string[] = []
    const args: any[] = []

    if (name !== undefined) { setClauses.push('name = ?'); args.push(name) }
    if (slug !== undefined) { setClauses.push('slug = ?'); args.push(slug) }
    if (description !== undefined) { setClauses.push('description = ?'); args.push(description) }
    if (price_per_person_usd !== undefined) { setClauses.push('price_per_person_usd = ?'); args.push(price_per_person_usd) }
    if (is_active !== undefined) { setClauses.push('is_active = ?'); args.push(is_active ? 1 : 0) }
    if (sort_order !== undefined) { setClauses.push('sort_order = ?'); args.push(sort_order) }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    await db.execute({
      sql: `UPDATE trips SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Trips API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('trips', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })

    const db = getDb()
    await db.execute({ sql: 'DELETE FROM trips WHERE id = ?', args: [parseInt(id)] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Trips API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
  }
}