import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

export interface DriverProfile {
  id: number
  clerk_user_id: string
  name: string
  phone: string | null
  email: string | null
  vehicle: string
  plate: string
  category: string
  status: string
  rating: number
  languages: string | null
  experience_level: string | null
  photo_url: string | null
  commission_rate: number | null
  profile_complete: number
  license_number: string | null
  license_expiry: string | null
  bank_account: string | null
  city: string | null
  vip_compatible: number
  total_trips: number
}

export async function getDriverFromSession(): Promise<{ driver: DriverProfile; clerkId: string } | { error: string; status: number }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { error: 'Unauthorized', status: 401 }
  }

  const db = getDb()
  const result = await db.execute({
    sql: `SELECT d.* FROM drivers d WHERE d.clerk_user_id = ?`,
    args: [clerkId],
  })

  if (result.rows.length === 0) {
    return { error: 'Driver profile not found', status: 404 }
  }

  return { driver: result.rows[0] as unknown as DriverProfile, clerkId }
}

export async function ensureDriverProfile(clerkId: string): Promise<DriverProfile> {
  const db = getDb()

  const existing = await db.execute({
    sql: `SELECT d.* FROM drivers d WHERE d.clerk_user_id = ?`,
    args: [clerkId],
  })

  if (existing.rows.length > 0) {
    return existing.rows[0] as unknown as DriverProfile
  }

  // Auto-create driver profile from Clerk user data
  let clerkUser
  try {
    const client = await clerkClient()
    clerkUser = await client.users.getUser(clerkId)
  } catch {
    throw new Error('DRIVER_NOT_FOUND')
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() || email || 'Conductor'

  const result = await db.execute({
    sql: `INSERT INTO drivers (
      clerk_user_id, name, email, phone, vehicle, plate, category,
      status, rating, languages, experience_level, profile_complete,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, NULL, 'Sin asignar', 'Sin asignar', 'standard',
      'available', 5.0, 'Spanish', 'Standard', 0,
      datetime('now'), datetime('now')
    )`,
    args: [clerkId, name, email],
  })

  const driverId = Number(result.lastInsertRowid)
  console.log(`[Driver Auth] Auto-created driver profile: ${name} (${email}) id=${driverId}`)

  const newDriver = await db.execute({
    sql: `SELECT d.* FROM drivers d WHERE d.id = ?`,
    args: [driverId],
  })

  return newDriver.rows[0] as unknown as DriverProfile
}
