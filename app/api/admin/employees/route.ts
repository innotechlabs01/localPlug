import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const ALLOWED_EMPLOYEE_COLUMNS = ['name', 'email', 'phone', 'role_id', 'avatar_url', 'vehicle_info', 'license_number', 'vehicle_plate', 'employee_status', 'verification_status', 'status', 'notes']

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    const result = await db.execute(`
      SELECT
        u.id, u.clerk_id, u.name, u.email, u.phone, u.avatar_url,
        u.vehicle_info, u.license_number, u.vehicle_plate,
        u.employee_status, u.verification_status, u.rating, u.total_trips, u.total_revenue,
        u.status, u.created_at,
        r.id as role_id, r.name as role_name, r.description as role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.role_id IS NOT NULL
      ORDER BY u.created_at DESC
    `)

    return NextResponse.json({ employees: result.rows })
  } catch (error) {
    console.error('[Employees API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name, email, phone, role_id,
      vehicle_info, license_number, vehicle_plate,
      employee_status, verification_status, notes
    } = body

    if (!name || !email || !role_id) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    const db = getDb()

    // Check if user already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    })

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Employee with this email already exists' }, { status: 409 })
    }

    const result = await db.execute({
      sql: `INSERT INTO users (
        name, email, phone, role_id,
        vehicle_info, license_number, vehicle_plate,
        employee_status, verification_status, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
      args: [
        name, email, phone || null, role_id,
        vehicle_info || null, license_number || null, vehicle_plate || null,
        employee_status || 'active', verification_status || 'pending',
      ],
    })

    // Log activity
    await db.execute({
      sql: `INSERT INTO employee_activity (user_id, activity_type, description, created_at)
            VALUES (?, 'created', ?, datetime('now'))`,
      args: [Number(result.lastInsertRowid), `Employee ${name} created`],
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Employees API] Create error:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    const db = getDb()
    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_EMPLOYEE_COLUMNS)

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    setClauses.push('updated_at = datetime(\'now\')')
    args.push(id)

    await db.execute({
      sql: `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Employees API] Update error:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    const db = getDb()

    // Soft delete - set status to inactive
    await db.execute({
      sql: `UPDATE users SET status = 'inactive', employee_status = 'inactive', updated_at = datetime('now') WHERE id = ?`,
      args: [parseInt(id)],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Employees API] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
