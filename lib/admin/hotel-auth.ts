import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * Resolves the current user's hotel context.
 * - Admins see all hotels (returns null hotel_id = unrestricted)
 * - Hotel managers see only their assigned hotel
 * - Other roles get 403
 *
 * Returns { hotelId: number | null, isAdmin: boolean, error?: NextResponse }
 */
export async function resolveHotelContext(): Promise<{
  hotelId: number | null
  isAdmin: boolean
  roleName: string
  error?: NextResponse
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { hotelId: null, isAdmin: false, roleName: '', error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const db = getDb()
  const user = await db.execute({
    sql: `SELECT u.id, u.hotel_id, r.name as role_name
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.clerk_id = ? AND u.status = 'active'`,
    args: [clerkId],
  })

  if (!user.rows.length) {
    return { hotelId: null, isAdmin: false, roleName: '', error: NextResponse.json({ error: 'User not found' }, { status: 403 }) }
  }

  const roleName = (user.rows[0].role_name as string) || ''
  const hotelId = user.rows[0].hotel_id as number | null

  if (roleName === 'admin') {
    return { hotelId: null, isAdmin: true, roleName: 'admin' }
  }

  if (roleName === 'hotel_manager') {
    if (!hotelId) {
      return { hotelId: null, isAdmin: false, roleName, error: NextResponse.json({ error: 'No hotel assigned to this manager' }, { status: 403 }) }
    }
    return { hotelId, isAdmin: false, roleName }
  }

  return { hotelId: null, isAdmin: false, roleName, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

/**
 * Requires the current user to have access to a specific hotel.
 * Hotel managers can only access their own hotel.
 */
export async function requireHotelAccess(hotelId: number): Promise<NextResponse | undefined> {
  const ctx = await resolveHotelContext()
  if (ctx.error) return ctx.error

  if (!ctx.isAdmin && ctx.hotelId !== hotelId) {
    return NextResponse.json({ error: 'Forbidden: not your hotel' }, { status: 403 })
  }
}
