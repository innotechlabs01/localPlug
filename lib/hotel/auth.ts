import { auth } from '@clerk/nextjs/server'
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

  const db = getDb()

  // Find user with hotel_manager role
  const userResult = await db.execute({
    sql: `SELECT u.id, u.clerk_id, u.name, u.email, u.role_id, u.hotel_id
          FROM users u
          WHERE u.clerk_id = ? AND u.status = 'active'`,
    args: [clerkId],
  })

  if (userResult.rows.length === 0) {
    return { error: 'Hotel profile not found', status: 404 }
  }

  const user = userResult.rows[0] as unknown as HotelUser
  if (!user.hotel_id) {
    return { error: 'No hotel assigned', status: 404 }
  }

  // Get hotel data
  const hotelResult = await db.execute({
    sql: `SELECT h.* FROM hotels h WHERE h.id = ?`,
    args: [user.hotel_id],
  })

  if (hotelResult.rows.length === 0) {
    return { error: 'Hotel not found', status: 404 }
  }

  return { hotel: hotelResult.rows[0] as unknown as HotelProfile, user, clerkId }
}

export async function ensureHotelProfile(clerkId: string): Promise<{ hotel: HotelProfile; user: HotelUser }> {
  const db = getDb()

  const existing = await db.execute({
    sql: `SELECT u.id, u.clerk_id, u.name, u.email, u.role_id, u.hotel_id
          FROM users u WHERE u.clerk_id = ? AND u.status = 'active'`,
    args: [clerkId],
  })

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
