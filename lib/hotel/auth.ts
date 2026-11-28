import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

export interface HotelProfile {
  id: number
  clerk_user_id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  stars: number
  status: string
  commission_rate: number
  bank_account: string | null
  permits: string | null
  profile_complete: number
}

export interface HotelUser {
  id: number
  clerk_id: string
  name: string
  email: string
  role_id: number
  hotel_id: number
}

export async function getHotelFromSession(): Promise<{ hotel: HotelProfile; user: HotelUser; clerkId: string } | { error: string; status: number }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const { hotel, user } = await ensureHotelProfile(clerkId)
    return { hotel, user, clerkId }
  } catch {
    return { error: 'Hotel profile not found', status: 404 }
  }
}

export async function ensureHotelProfile(clerkId: string): Promise<{ hotel: HotelProfile; user: HotelUser }> {
  const db = getDb()

  let existing = await db.execute({
    sql: `SELECT u.id, u.clerk_id, u.name, u.email, u.role_id, u.hotel_id
          FROM users u WHERE u.clerk_id = ? AND u.status = 'active'`,
    args: [clerkId],
  })

  // Link pre-created hotel manager user or hotel record by verified email on first login
  if (existing.rows.length === 0 || !(existing.rows[0] as unknown as HotelUser).hotel_id) {
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(clerkId)
      const email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '').trim().toLowerCase()
      if (email) {
        const byEmail = await db.execute({
          sql: `SELECT id, hotel_id, status FROM users WHERE LOWER(email) = ? LIMIT 1`,
          args: [email],
        })
        if (byEmail.rows.length > 0 && byEmail.rows[0].hotel_id) {
          const nextStatus = byEmail.rows[0].status === 'inactive' ? 'active' : byEmail.rows[0].status
          await db.execute({
            sql: `UPDATE users SET clerk_id = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [clerkId, nextStatus, Number(byEmail.rows[0].id)],
          })
          existing = await db.execute({
            sql: `SELECT u.id, u.clerk_id, u.name, u.email, u.role_id, u.hotel_id
                  FROM users u WHERE u.clerk_id = ? AND u.status = 'active'`,
            args: [clerkId],
          })
        }
      }
    } catch {
      // ignore Clerk lookup failure
    }
  }

  if (existing.rows.length === 0) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  const user = existing.rows[0] as unknown as HotelUser
  if (!user.hotel_id) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  const hotelResult = await db.execute({
    sql: `SELECT h.* FROM hotels h WHERE h.id = ?`,
    args: [user.hotel_id],
  })

  if (hotelResult.rows.length === 0) {
    throw new Error('HOTEL_NOT_FOUND')
  }

  return {
    hotel: hotelResult.rows[0] as unknown as HotelProfile,
    user,
  }
}
