import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ensureDriverProfile } from '@/lib/driver/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/driver/claim-role
 *
 * Legacy compatibility endpoint: roles are now managed strictly in the Database
 * (Clerk is used only for session authentication). Ensures the driver row exists in DB.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const driver = await ensureDriverProfile(clerkId)
    return NextResponse.json({ fixed: false, role: 'driver', driverId: driver.id })
  } catch (err) {
    console.error('[Driver Claim] Error:', err)
    return NextResponse.json({ error: 'Failed to verify driver profile' }, { status: 500 })
  }
}
