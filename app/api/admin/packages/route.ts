import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  try {
    const authError = await requirePermission('plans', 'view')
    if (authError) return authError

    const db = getDb()

    const packagesResult = await db.execute('SELECT * FROM packages ORDER BY sort_order ASC')
    const packages = packagesResult.rows || []

    const packagesWithDetails = await Promise.all(packages.map(async (pkg: any) => {
      const featuresResult = await db.execute({
        sql: 'SELECT * FROM package_features WHERE package_id = ? ORDER BY sort_order',
        args: [pkg.id],
      })

      const toursResult = await db.execute({
        sql: 'SELECT * FROM tours WHERE package_id = ? ORDER BY sort_order',
        args: [pkg.id],
      })

      return {
        id: pkg.id,
        slug: pkg.slug,
        name: pkg.name,
        description: pkg.description,
        base_price_usd: Number(pkg.base_price_usd),
        includes_pickup: Boolean(pkg.includes_pickup),
        includes_sim: Boolean(pkg.includes_sim),
        includes_accompaniment: Boolean(pkg.includes_accompaniment),
        accompaniment_hours: Number(pkg.accompaniment_hours),
        accompaniment_type: pkg.accompaniment_type,
        includes_round_trip: Boolean(pkg.includes_round_trip),
        includes_concierge: Boolean(pkg.includes_concierge),
        service_fee_flat: Number(pkg.service_fee_flat),
        is_popular: Boolean(pkg.is_popular),
        is_active: Boolean(pkg.is_active),
        sort_order: Number(pkg.sort_order),
        features: featuresResult.rows.map((f: any) => ({ id: f.id, text: f.text, sort_order: f.sort_order })),
        tours: toursResult.rows.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          price_per_person_usd: Number(t.price_per_person_usd),
          vehicle_type: t.vehicle_type,
          duration_hours: Number(t.duration_hours),
          max_people: Number(t.max_people),
          is_active: Boolean(t.is_active),
          sort_order: t.sort_order,
        })),
      }
    }))

    return NextResponse.json({ packages: packagesWithDetails })
  } catch (error) {
    console.error('[Packages API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('plans', 'create')
    if (authError) return authError

    const body = await req.json()
    const {
      name, slug, description, base_price_usd,
      includes_pickup, includes_sim, includes_accompaniment,
      accompaniment_hours, accompaniment_type,
      includes_round_trip, includes_concierge, service_fee_flat,
      is_popular, is_active, sort_order,
      features, tours,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Package name is required' }, { status: 400 })
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const db = getDb()

    const existing = await db.execute({ sql: 'SELECT id FROM packages WHERE slug = ?', args: [finalSlug] })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A package with this slug already exists' }, { status: 409 })
    }

    const result = await db.execute({
      sql: `INSERT INTO packages (slug, name, description, base_price_usd,
        includes_pickup, includes_sim, includes_accompaniment, accompaniment_hours, accompaniment_type,
        includes_round_trip, includes_concierge, service_fee_flat, is_popular, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        finalSlug, name, description || '', base_price_usd || 0,
        includes_pickup ? 1 : 0, includes_sim ? 1 : 0,
        includes_accompaniment ? 1 : 0, accompaniment_hours || 0, accompaniment_type || null,
        includes_round_trip ? 1 : 0, includes_concierge ? 1 : 0,
        service_fee_flat || 0, is_popular ? 1 : 0, is_active !== false ? 1 : 0, sort_order || 0,
      ],
    })

    const packageId = Number(result.lastInsertRowid)

    if (features && Array.isArray(features)) {
      for (let i = 0; i < features.length; i++) {
        const featureText = typeof features[i] === 'string' ? features[i] : features[i].text
        await db.execute({
          sql: 'INSERT INTO package_features (package_id, text, sort_order) VALUES (?, ?, ?)',
          args: [packageId, featureText, i + 1],
        })
      }
    }

    if (tours && Array.isArray(tours)) {
      for (let i = 0; i < tours.length; i++) {
        const tour = tours[i]
        await db.execute({
          sql: 'INSERT INTO tours (package_id, name, description, price_per_person_usd, vehicle_type, duration_hours, max_people, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            packageId, tour.name, tour.description || '', tour.price_per_person_usd || 0,
            tour.vehicle_type || 'suv', tour.duration_hours || 8, tour.max_people || 10, i + 1,
          ],
        })
      }
    }

    return NextResponse.json({ success: true, id: packageId, slug: finalSlug })
  } catch (error) {
    console.error('[Packages API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('plans', 'update')
    if (authError) return authError

    const body = await req.json()
    const {
      id, name, slug, description, base_price_usd,
      includes_pickup, includes_sim, includes_accompaniment,
      accompaniment_hours, accompaniment_type,
      includes_round_trip, includes_concierge, service_fee_flat,
      is_popular, is_active, sort_order,
      features, tours,
    } = body

    if (!id) return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })

    const db = getDb()
    const setClauses: string[] = []
    const args: any[] = []

    if (name !== undefined) { setClauses.push('name = ?'); args.push(name) }
    if (slug !== undefined) { setClauses.push('slug = ?'); args.push(slug) }
    if (description !== undefined) { setClauses.push('description = ?'); args.push(description) }
    if (base_price_usd !== undefined) { setClauses.push('base_price_usd = ?'); args.push(base_price_usd) }
    if (includes_pickup !== undefined) { setClauses.push('includes_pickup = ?'); args.push(includes_pickup ? 1 : 0) }
    if (includes_sim !== undefined) { setClauses.push('includes_sim = ?'); args.push(includes_sim ? 1 : 0) }
    if (includes_accompaniment !== undefined) { setClauses.push('includes_accompaniment = ?'); args.push(includes_accompaniment ? 1 : 0) }
    if (accompaniment_hours !== undefined) { setClauses.push('accompaniment_hours = ?'); args.push(accompaniment_hours) }
    if (accompaniment_type !== undefined) { setClauses.push('accompaniment_type = ?'); args.push(accompaniment_type) }
    if (includes_round_trip !== undefined) { setClauses.push('includes_round_trip = ?'); args.push(includes_round_trip ? 1 : 0) }
    if (includes_concierge !== undefined) { setClauses.push('includes_concierge = ?'); args.push(includes_concierge ? 1 : 0) }
    if (service_fee_flat !== undefined) { setClauses.push('service_fee_flat = ?'); args.push(service_fee_flat) }
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
        sql: `UPDATE packages SET ${setClauses.join(', ')} WHERE id = ?`,
        args,
      })
    }

    if (features && Array.isArray(features)) {
      await db.execute({ sql: 'DELETE FROM package_features WHERE package_id = ?', args: [id] })
      for (let i = 0; i < features.length; i++) {
        const featureText = typeof features[i] === 'string' ? features[i] : features[i].text
        await db.execute({
          sql: 'INSERT INTO package_features (package_id, text, sort_order) VALUES (?, ?, ?)',
          args: [id, featureText, i + 1],
        })
      }
    }

    if (tours && Array.isArray(tours)) {
      await db.execute({ sql: 'DELETE FROM tours WHERE package_id = ?', args: [id] })
      for (let i = 0; i < tours.length; i++) {
        const tour = tours[i]
        await db.execute({
          sql: 'INSERT INTO tours (package_id, name, description, price_per_person_usd, vehicle_type, duration_hours, max_people, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            id, tour.name, tour.description || '', tour.price_per_person_usd || 0,
            tour.vehicle_type || 'suv', tour.duration_hours || 8, tour.max_people || 10,
            tour.is_active !== false ? 1 : 0, i + 1,
          ],
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Packages API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('plans', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })

    const db = getDb()
    await db.execute({ sql: 'DELETE FROM package_features WHERE package_id = ?', args: [parseInt(id)] })
    await db.execute({ sql: 'DELETE FROM tours WHERE package_id = ?', args: [parseInt(id)] })
    await db.execute({ sql: 'DELETE FROM packages WHERE id = ?', args: [parseInt(id)] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Packages API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}
