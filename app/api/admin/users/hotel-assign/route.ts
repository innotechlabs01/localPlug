import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

/**
 * Admin-only: assign a user as hotel manager for a specific hotel.
 * PUT { user_id, hotel_id } — assigns user to hotel (set hotel_id on users table)
 * PUT { user_id, hotel_id: null } — unassigns user from hotel
 * GET ?hotel_id=X — returns the current manager for a hotel
 */
export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'update')
    if (authError) return authError

    const body = await req.json()
    const { user_id, hotel_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const db = getDb()

    // If assigning, verify hotel exists
    if (hotel_id) {
      const hotel = await db.execute({ sql: 'SELECT id FROM hotels WHERE id = ?', args: [hotel_id] })
      if (!hotel.rows.length) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
      }
      // First unassign any other user from this hotel
      await db.execute({
        sql: 'UPDATE users SET hotel_id = NULL WHERE hotel_id = ?',
        args: [hotel_id],
      })
    }

    await db.execute({
      sql: 'UPDATE users SET hotel_id = ? WHERE id = ?',
      args: [hotel_id || null, user_id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Hotel Assign API] error:', error)
    return NextResponse.json({ error: 'Failed to assign hotel' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'view')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const hotelId = searchParams.get('hotel_id')

    if (!hotelId) {
      return NextResponse.json({ error: 'hotel_id is required' }, { status: 400 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `SELECT u.id, u.name, u.email, u.clerk_id, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.hotel_id = ?`,
      args: [parseInt(hotelId)],
    })

    return NextResponse.json({ manager: result.rows[0] || null })
  } catch (error) {
    console.error('[Hotel Assign API] error:', error)
    return NextResponse.json({ error: 'Failed to get manager' }, { status: 500 })
  }
}
