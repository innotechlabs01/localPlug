import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { listVehicleCategories, createVehicleCategory } from '@/lib/payout'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError
  const db = getDb()
  // Full list (incl. inactive) with driver counts for the admin tariff view
  const result = await db.execute({
    sql: `SELECT vc.*, (SELECT COUNT(*) FROM drivers d WHERE d.vehicle_category_id = vc.id) AS driver_count
          FROM vehicle_categories vc ORDER BY vc.sort_order ASC, vc.name ASC`,
    args: [],
  })
  return NextResponse.json({ categories: result.rows })
}

export async function POST(req: Request) {
  const authError = await requirePermission('payments', 'create')
  if (authError) return authError
  const body = await req.json().catch(() => ({}))
  const name = String(body?.name || '').trim()
  const trip_fare_usd = Number(body?.trip_fare_usd)
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!Number.isFinite(trip_fare_usd) || trip_fare_usd < 0) {
    return NextResponse.json({ error: 'trip_fare_usd must be a non-negative number' }, { status: 400 })
  }
  const cat = await createVehicleCategory({
    name,
    trip_fare_usd,
    sort_order: Number(body?.sort_order) || 0,
  })
  return NextResponse.json({ category: cat }, { status: 201 })
}

export async function DELETE(req: Request) {
  const authError = await requirePermission('payments', 'delete')
  if (authError) return authError
  const { ids } = await req.json().catch(() => ({}))
  const list = Array.isArray(ids) ? ids.map(Number).filter(Number.isFinite) : []
  if (list.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 })
  const db = getDb()
  const placeholders = list.map(() => '?').join(',')
  await db.execute({
    sql: `DELETE FROM vehicle_categories WHERE id IN (${placeholders}) AND is_active = 0`,
    args: list,
  })
  return NextResponse.json({ deleted: list.length })
}