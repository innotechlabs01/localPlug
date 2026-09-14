import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import { updateVehicleCategory, getVehicleCategory } from '@/lib/payout'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requirePermission('payments', 'update')
  if (authError) return authError
  const { id } = await params
  const categoryId = Number(id)
  if (Number.isNaN(categoryId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
  if (body.trip_fare_usd !== undefined) {
    const fare = Number(body.trip_fare_usd)
    if (!Number.isFinite(fare) || fare < 0) {
      return NextResponse.json({ error: 'trip_fare_usd must be a non-negative number' }, { status: 400 })
    }
    patch.trip_fare_usd = fare
  }
  if (body.is_active !== undefined) patch.is_active = body.is_active ? 1 : 0
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0

  const updated = await updateVehicleCategory(categoryId, patch)
  if (!updated) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  return NextResponse.json({ category: updated })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError
  const { id } = await params
  const cat = await getVehicleCategory(Number(id))
  if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  return NextResponse.json({ category: cat })
}