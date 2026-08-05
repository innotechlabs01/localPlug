import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  try {
    const authError = await requirePermission('plans', 'view')
    if (authError) return authError

    const db = getDb()

    const plansResult = await db.execute('SELECT * FROM plans ORDER BY sort_order ASC')
    const plans = plansResult.rows || []

    const plansWithDetails = await Promise.all(plans.map(async (plan: any) => {
      const featuresResult = await db.execute({
        sql: 'SELECT * FROM plan_features WHERE plan_id = ? ORDER BY sort_order',
        args: [plan.id],
      })

      const toursResult = await db.execute({
        sql: 'SELECT * FROM plan_tours WHERE plan_id = ? ORDER BY sort_order',
        args: [plan.id],
      })

      return {
        ...plan,
        features: featuresResult.rows || [],
        tours: toursResult.rows || [],
      }
    }))

    return NextResponse.json({ plans: plansWithDetails })
  } catch (error) {
    console.error('[Plans API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('plans', 'create')
    if (authError) return authError

    const body = await req.json()
    const { name, slug, description, price_usd, price_per_person_usd, is_popular, is_active, sort_order, features, tours } = body

    if (!name) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const db = getDb()

    const existing = await db.execute({ sql: 'SELECT id FROM plans WHERE slug = ?', args: [finalSlug] })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A plan with this slug already exists' }, { status: 409 })
    }

    const result = await db.execute({
      sql: `INSERT INTO plans (name, slug, description, price_usd, price_per_person_usd, is_popular, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        name, finalSlug, description || '', price_usd || 0, price_per_person_usd || 0,
        is_popular ? 1 : 0, is_active !== false ? 1 : 0, sort_order || 0,
      ],
    })

    const planId = Number(result.lastInsertRowid)

    if (features && Array.isArray(features)) {
      for (let i = 0; i < features.length; i++) {
        await db.execute({
          sql: 'INSERT INTO plan_features (plan_id, text, sort_order) VALUES (?, ?, ?)',
          args: [planId, features[i], i + 1],
        })
      }
    }

    if (tours && Array.isArray(tours)) {
      for (let i = 0; i < tours.length; i++) {
        const tour = tours[i]
        await db.execute({
          sql: 'INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          args: [planId, tour.name, tour.description || '', tour.price_per_person_usd || 0, tour.is_active !== false ? 1 : 0, i + 1],
        })
      }
    }

    return NextResponse.json({ success: true, id: planId, slug: finalSlug })
  } catch (error) {
    console.error('[Plans API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('plans', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, name, slug, description, price_usd, price_per_person_usd, is_popular, is_active, sort_order, features, tours } = body

    if (!id) return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })

    const db = getDb()
    const setClauses: string[] = []
    const args: any[] = []

    if (name !== undefined) { setClauses.push('name = ?'); args.push(name) }
    if (slug !== undefined) { setClauses.push('slug = ?'); args.push(slug) }
    if (description !== undefined) { setClauses.push('description = ?'); args.push(description) }
    if (price_usd !== undefined) { setClauses.push('price_usd = ?'); args.push(price_usd) }
    if (price_per_person_usd !== undefined) { setClauses.push('price_per_person_usd = ?'); args.push(price_per_person_usd) }
    if (is_popular !== undefined) { setClauses.push('is_popular = ?'); args.push(is_popular ? 1 : 0) }
    if (is_active !== undefined) { setClauses.push('is_active = ?'); args.push(is_active ? 1 : 0) }
    if (sort_order !== undefined) { setClauses.push('sort_order = ?'); args.push(sort_order) }

    if (setClauses.length === 0 && !features && !tours) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    if (setClauses.length > 0) {
      setClauses.push("updated_at = datetime('now')")
      args.push(id)

      await db.execute({
        sql: `UPDATE plans SET ${setClauses.join(', ')} WHERE id = ?`,
        args,
      })
    }

    if (features && Array.isArray(features)) {
      await db.execute({ sql: 'DELETE FROM plan_features WHERE plan_id = ?', args: [id] })
      for (let i = 0; i < features.length; i++) {
        await db.execute({
          sql: 'INSERT INTO plan_features (plan_id, text, sort_order) VALUES (?, ?, ?)',
          args: [id, features[i], i + 1],
        })
      }
    }

    if (tours && Array.isArray(tours)) {
      await db.execute({ sql: 'DELETE FROM plan_tours WHERE plan_id = ?', args: [id] })
      for (let i = 0; i < tours.length; i++) {
        const tour = tours[i]
        await db.execute({
          sql: 'INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          args: [id, tour.name, tour.description || '', tour.price_per_person_usd || 0, tour.is_active !== false ? 1 : 0, i + 1],
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Plans API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('plans', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })

    const db = getDb()
    await db.execute({ sql: 'DELETE FROM plan_features WHERE plan_id = ?', args: [parseInt(id)] })
    await db.execute({ sql: 'DELETE FROM plan_tours WHERE plan_id = ?', args: [parseInt(id)] })
    await db.execute({ sql: 'DELETE FROM plans WHERE id = ?', args: [parseInt(id)] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Plans API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
