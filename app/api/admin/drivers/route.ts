import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const ALLOWED_DRIVER_COLUMNS = ['name', 'phone', 'email', 'vehicle', 'plate', 'category', 'status', 'rating', 'languages', 'experience_level', 'notes', 'license_expiry', 'soat_expiry', 'tech_inspection_expiry', 'insurance_expiry', 'year', 'capacity', 'emergency_contact', 'emergency_phone', 'city']

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getDb()
    const result = await db.execute(`
      SELECT d.*,
        (SELECT COUNT(*) FROM orders o WHERE o.assigned_to = d.id AND o.dispatch_status = 'assigned') as active_orders
      FROM drivers d
      ORDER BY d.status ASC, d.rating DESC
    `)

    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const drivers = (result.rows as any[]).map(d => {
      const expiryFields = ['license_expiry', 'soat_expiry', 'tech_inspection_expiry', 'insurance_expiry']
      let worstStatus = 'valid'

      for (const field of expiryFields) {
        const val = d[field as keyof typeof d]
        if (!val) continue
        const expiryDate = new Date(val as string)
        if (expiryDate < now) {
          worstStatus = 'expired'
          break
        }
        if (expiryDate <= in30Days) {
          worstStatus = 'warning'
        }
      }

      return { ...d, doc_status: worstStatus }
    })

    return NextResponse.json({ drivers })
  } catch (error) {
    console.error('[Drivers API] GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      name, phone, email, vehicle, plate, category,
      languages, experience_level, notes,
      license_expiry, soat_expiry, tech_inspection_expiry, insurance_expiry,
      year, capacity, emergency_contact, emergency_phone, city
    } = body

    if (!name || !vehicle || !plate) {
      return NextResponse.json({ error: 'name, vehicle, plate required' }, { status: 400 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `INSERT INTO drivers (
        name, phone, email, vehicle, plate, category, status, rating,
        languages, experience_level, notes,
        license_expiry, soat_expiry, tech_inspection_expiry, insurance_expiry,
        year, capacity, emergency_contact, emergency_phone, city,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 'available', 5.0,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        datetime('now'), datetime('now')
      )`,
      args: [
        name, phone || null, email || null,
        vehicle, plate, category || 'standard',
        languages || 'Spanish', experience_level || 'Standard', notes || null,
        license_expiry || null, soat_expiry || null, tech_inspection_expiry || null, insurance_expiry || null,
        year || null, capacity || null, emergency_contact || null, emergency_phone || null, city || null,
      ],
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Drivers API] POST error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_DRIVER_COLUMNS)

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })

    setClauses.push('updated_at = datetime(\'now\')')
    args.push(id)

    await db.execute({
      sql: `UPDATE drivers SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Drivers API] PUT error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    await db.execute({
      sql: `UPDATE drivers SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`,
      args: [parseInt(id)],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Drivers API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
