import { NextResponse } from 'next/server'
import { getDriverFromSession } from '@/lib/driver/auth'
import { listVehicleCategories } from '@/lib/payout'

export const dynamic = 'force-dynamic'

/** Active vehicle categories for the signed-in driver (selection + fare display). */
export async function GET() {
  const result = await getDriverFromSession()
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  const categories = await listVehicleCategories(false) // active only
  return NextResponse.json({ categories })
}