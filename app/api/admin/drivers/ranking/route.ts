import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('drivers', 'view')
  if (authError) return authError

  const db = getDb()

  const drivers = await db.execute(`
    SELECT d.id, d.name, d.vehicle, d.plate, d.rating, d.total_trips, d.vip_compatible, d.status,
      (SELECT COUNT(*) FROM orders WHERE assigned_to = d.id) as total_orders,
      (SELECT COUNT(*) FROM orders WHERE assigned_to = d.id AND dispatch_status = 'completed') as completed_orders
    FROM drivers d
    WHERE d.status != 'inactive'
    ORDER BY d.rating DESC, d.total_trips DESC
    LIMIT 20
  `)

  return NextResponse.json({ ranking: drivers.rows })
}
