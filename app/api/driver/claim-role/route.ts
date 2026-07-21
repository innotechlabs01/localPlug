import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/driver/claim-role
 *
 * Fixes role mismatch: if a user has a driver profile in the DB
 * but their Clerk publicMetadata.role isn't 'driver', this endpoint
 * corrects it. Called automatically by the driver layout on mount.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Check if user has a driver profile
    const driverResult = await db.execute({
      sql: `SELECT id FROM drivers WHERE clerk_user_id = ? AND status = 'active'`,
      args: [clerkId],
    })

    if (driverResult.rows.length === 0) {
      return NextResponse.json({ error: 'not_a_driver' }, { status: 404 })
    }

    // Check current Clerk role
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkId)
    const currentRole = clerkUser.publicMetadata?.role as string | undefined

    if (currentRole === 'driver') {
      return NextResponse.json({ fixed: false, role: currentRole })
    }

    // Fix: set role to 'driver'
    await client.users.updateUser(clerkId, {
      publicMetadata: { ...clerkUser.publicMetadata, role: 'driver' },
    })

    console.log(`[Driver Claim] Fixed role for ${clerkId}: ${currentRole || 'none'} → driver`)
    return NextResponse.json({ fixed: true, previousRole: currentRole || null, role: 'driver' })
  } catch (err) {
    console.error('[Driver Claim] Error:', err)
    return NextResponse.json({ error: 'Failed to claim role' }, { status: 500 })
  }
}
