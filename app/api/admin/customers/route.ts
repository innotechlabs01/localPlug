import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

const ALLOWED_CUSTOMER_COLUMNS = ['name', 'email', 'phone', 'country', 'languages', 'status', 'vip_level', 'notes', 'tags', 'preferences']

export type Customer = {
  id: number
  email: string
  name: string
  phone: string
  country: string
  languages: string
  status: string
  vip_level: string
  notes: string
  tags: string
  preferences: string
  total_trips: number
  lifetime_value: number
  last_trip_date: string | null
  first_trip_date: string | null
  created_at: string
  updated_at: string
}

async function syncCustomersFromOrders(db: any) {
  const existing = await db.execute('SELECT COUNT(*) as count FROM customers')
  if (existing.rows?.[0]?.count > 0) return

  const orders = await db.execute(`
    SELECT 
      customer_email, customer_name, customer_phone, customer_country,
      package_price, status, created_at
    FROM orders 
    WHERE customer_email IS NOT NULL AND customer_email != ''
    GROUP BY customer_email
    ORDER BY MIN(created_at) ASC
  `)

  for (const row of (orders.rows || [])) {
    const tripStats = await db.execute({
      sql: `SELECT COUNT(*) as trips, SUM(package_price) as ltv, MAX(created_at) as last_trip, MIN(created_at) as first_trip
            FROM orders WHERE customer_email = ?`,
      args: [row.customer_email],
    })
    const s = tripStats.rows?.[0] || {}
    await db.execute({
      sql: `INSERT OR IGNORE INTO customers (email, name, phone, country, languages, total_trips, lifetime_value, last_trip_date, first_trip_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), datetime('now'))`,
      args: [
        row.customer_email, row.customer_name, row.customer_phone || '', row.customer_country || '',
        '', s.trips || 0, s.ltv || 0,
        s.last_trip || null, s.first_trip || null, row.created_at,
      ],
    })
  }
}

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('customers', 'view')
    if (authError) return authError

    const db = getDb()
    await syncCustomersFromOrders(db)

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const vip = searchParams.get('vip') || ''

    let sql = `SELECT * FROM customers WHERE 1=1`
    const args: (string | number)[] = []

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR country LIKE ?)`
      const like = `%${search}%`
      args.push(like, like, like, like)
    }
    if (status && status !== 'all') {
      sql += ` AND status = ?`
      args.push(status)
    }
    if (vip) {
      sql += ` AND vip_level = ?`
      args.push(vip)
    }

    sql += ` ORDER BY created_at DESC`

    const result = await db.execute({ sql, args })
    const customers = (result.rows || []) as unknown as Customer[]

    const kpiResult = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN created_at >= date('now', 'start of month') THEN 1 ELSE 0 END) as new_month,
        SUM(CASE WHEN vip_level IN ('platinum','gold') THEN 1 ELSE 0 END) as vip,
        SUM(total_trips) as total_trips,
        SUM(lifetime_value) as total_ltv
      FROM customers
    `)
    const kpi = kpiResult.rows?.[0] || {}

    return NextResponse.json({ customers, kpi })
  } catch (error) {
    console.error('[Customers API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('customers', 'create')
    if (authError) return authError

    const body = await req.json()
    const { name, email, phone, country, languages, status, vip_level, notes, tags } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `INSERT INTO customers (name, email, phone, country, languages, status, vip_level, notes, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        name, email, phone || '', country || '', languages || '',
        status || 'active', vip_level || 'standard', notes || '', tags || '[]',
      ],
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Customers API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('customers', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_CUSTOMER_COLUMNS)

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    await db.execute({
      sql: `UPDATE customers SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Customers API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('customers', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    await db.execute({
      sql: `UPDATE customers SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`,
      args: [parseInt(id)],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Customers API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to deactivate customer' }, { status: 500 })
  }
}
