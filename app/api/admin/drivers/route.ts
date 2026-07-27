import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { clerkClient } from '@clerk/nextjs/server'
import { triggerDriverCreated } from '@/lib/n8n/client'

const ALLOWED_DRIVER_COLUMNS = ['name', 'phone', 'email', 'vehicle', 'plate', 'category', 'status', 'rating', 'languages', 'experience_level', 'notes', 'license_expiry', 'soat_expiry', 'tech_inspection_expiry', 'insurance_expiry', 'year', 'capacity', 'emergency_contact', 'emergency_phone', 'city']

export async function GET() {
  try {
    const authError = await requirePermission('drivers', 'view')
    if (authError) return authError

    const db = getDb()
    const result = await db.execute(`
      SELECT d.*,
        (SELECT COUNT(*) FROM orders o WHERE o.assigned_to = d.id AND o.dispatch_status = 'assigned') as active_orders
      FROM drivers d
      WHERE d.status = 'active'
      ORDER BY d.rating DESC
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
    const authError = await requirePermission('drivers', 'create')
    if (authError) return authError

    const body = await req.json()
    const {
      name, phone, email, vehicle, plate, category,
      languages, experience_level, notes,
      license_expiry, soat_expiry, tech_inspection_expiry, insurance_expiry,
      year, capacity, emergency_contact, emergency_phone, city,
      driver_email, driver_password,
    } = body

    if (!name || !vehicle || !plate) {
      return NextResponse.json({ error: 'name, vehicle, plate required' }, { status: 400 })
    }

    if (!driver_email || !driver_password) {
      return NextResponse.json({ error: 'driver_email and driver_password required' }, { status: 400 })
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

    const driverId = Number(result.lastInsertRowid)

    // Create Clerk user for driver
    try {
      const client = await clerkClient()
      const nameParts = name.trim().split(/\s+/)
      const firstName = nameParts[0] || name
      const lastName = nameParts.slice(1).join(' ') || ''

      const clerkUser = await client.users.createUser({
        emailAddress: [driver_email],
        firstName,
        lastName,
        password: driver_password,
        privateMetadata: { role: 'driver', driver_id: driverId },
      })

      // Link Clerk user to driver record
      await db.execute({
        sql: `UPDATE drivers SET clerk_user_id = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [clerkUser.id, driverId],
      })

      // Send WhatsApp notification via n8n (fire and forget)
      triggerDriverCreated({
        driverName: name,
        driverEmail: driver_email,
        temporaryPassword: driver_password,
        driverPhone: phone || undefined,
        vehicle,
        plate,
      }).then(r => {
        if (!r.success) console.error('[Drivers API] Driver notification failed:', r.error)
      })

      return NextResponse.json({
        success: true,
        id: driverId,
        credentials: { email: driver_email, temporaryPassword: driver_password },
      })
    } catch (clerkError: any) {
      console.error('[Drivers API] Clerk user creation failed:', clerkError)
      // Driver was created but Clerk creation failed - still return success with warning
      return NextResponse.json({
        success: true,
        id: driverId,
        warning: 'Driver created but login account creation failed. Assign login later.',
        error: clerkError?.errors?.[0]?.message || clerkError?.message || 'Unknown Clerk error',
      })
    }
  } catch (error) {
    console.error('[Drivers API] POST error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('drivers', 'update')
    if (authError) return authError

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
    const authError = await requirePermission('drivers', 'delete')
    if (authError) return authError

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
