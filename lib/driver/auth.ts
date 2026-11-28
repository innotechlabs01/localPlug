import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import type { DatabaseClient } from '@lp/db/factory'

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
  vehicle_category_id: number | null
}

export async function getDriverFromSession(): Promise<{ driver: DriverProfile; clerkId: string } | { error: string; status: number }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const driver = await ensureDriverProfile(clerkId)
    return { driver, clerkId }
  } catch {
    return { error: 'Driver profile not found', status: 404 }
  }
}

interface DriverIdentity {
  email?: string | null
  name?: string | null
}

const CURRENT_USER_SQL = `SELECT u.id, r.name AS role_name
                          FROM users u LEFT JOIN roles r ON u.role_id = r.id
                          WHERE u.clerk_id = ?`

/**
 * Promotes a viewer to the driver role once a driver profile exists.
 * Never downgrades an explicitly assigned role (admin, hotel_manager, ...).
 */
async function assignDriverRole(
  db: DatabaseClient,
  clerkId: string,
  identity: DriverIdentity = {},
): Promise<void> {
  const roles = await db.execute({
    sql: `SELECT id, name FROM roles WHERE name IN ('viewer', 'driver')`,
    args: [],
  })

  const driverRoleRow = roles.rows.find((row) => row.name === 'driver')
  if (!driverRoleRow) {
    console.warn('[Driver Auth] driver role missing in roles table')
    return
  }
  const driverRoleId = Number(driverRoleRow.id)
  const viewerRoleRow = roles.rows.find((row) => row.name === 'viewer')
  const viewerRoleId = Number(viewerRoleRow?.id ?? 4)

  let currentUser = await db.execute({ sql: CURRENT_USER_SQL, args: [clerkId] })
  let user = currentUser.rows[0]

  // The webhook is asynchronous. If it has not created the users row yet,
  // relink/reactivate by email or create it here; otherwise the driver would
  // stay viewer until the next page load.
  if (!user && identity.email) {
    const email = identity.email.trim().toLowerCase()
    const byEmail = await db.execute({
      sql: `SELECT id, status FROM users WHERE LOWER(email) = ? LIMIT 1`,
      args: [email],
    })
    const linked = byEmail.rows[0]
    if (linked) {
      const nextStatus = linked.status === 'inactive' ? 'active' : linked.status
      await db.execute({
        sql: `UPDATE users
              SET clerk_id = ?, name = COALESCE(NULLIF(name, ''), ?), email = ?, status = ?,
                  updated_at = datetime('now')
              WHERE id = ?`,
        args: [clerkId, identity.name || '', email, nextStatus, Number(linked.id)],
      })
      currentUser = await db.execute({ sql: CURRENT_USER_SQL, args: [clerkId] })
      user = currentUser.rows[0]
    }
  }

  if (!user && viewerRoleRow) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, password_hash, role_id, status, created_at, updated_at)
            VALUES (?, ?, ?, '', ?, 'active', datetime('now'), datetime('now'))`,
      args: [clerkId, identity.name || 'Conductor', identity.email?.trim().toLowerCase() || '', viewerRoleId],
    })
    currentUser = await db.execute({ sql: CURRENT_USER_SQL, args: [clerkId] })
    user = currentUser.rows[0]
  }

  if (!user) {
    console.warn(`[Driver Auth] No users row for ${clerkId}; role sync deferred to webhook`)
    return
  }
  if (user.role_name && user.role_name !== 'viewer') {
    return
  }

  const userId = Number(user.id)

  await db.execute({
    sql: `UPDATE users SET role_id = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [driverRoleId, userId],
  })
  // Remove only the obsolete viewer grant; explicit roles assigned by an admin
  // in user_roles must survive the promotion.
  await db.execute({
    sql: `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
    args: [userId, viewerRoleId],
  })
  await db.execute({
    sql: `INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
    args: [userId, driverRoleId],
  })

  console.log(`[Driver Auth] Assigned driver role to ${clerkId}`)
}

/**
 * Resolves or auto-onboards a driver record in the database using Clerk ONLY as identity provider.
 * - Matches by `clerk_user_id` first.
 * - Links existing pre-registered `drivers` row by verified email if present.
 * - Otherwise creates an onboarding record (`status = 'inactive'`, `profile_complete = 0`)
 *   so the driver can fill out vehicle/plate/license details on `/driver` before going online.
 */
export async function ensureDriverProfile(clerkId: string): Promise<DriverProfile> {
  const db = getDb()

  // 1. Check by clerk_user_id
  const existing = await db.execute({
    sql: `SELECT d.* FROM drivers d WHERE d.clerk_user_id = ?`,
    args: [clerkId],
  })

  if (existing.rows.length > 0) {
    const row = existing.rows[0]
    await assignDriverRole(db, clerkId, {
      email: row.email as string | null | undefined,
      name: row.name as string | null | undefined,
    })
    return row as unknown as DriverProfile
  }

  // 2. Get Clerk user identity (email, name, phone) — no Clerk metadata used
  let email = ''
  let name = 'Conductor'
  let phone: string | null = null
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkId)
    email = (clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '').trim().toLowerCase()
    name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() || email || 'Conductor'
    phone = clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.phoneNumbers?.[0]?.phoneNumber || null
  } catch (err) {
    console.warn('[Driver Auth] Failed to fetch Clerk user details, using fallback defaults:', err)
  }

  // 3. Check if a driver with this email already exists (e.g. pre-created by admin)
  if (email) {
    const byEmail = await db.execute({
      sql: `SELECT d.* FROM drivers d WHERE LOWER(d.email) = ? LIMIT 1`,
      args: [email],
    })

    if (byEmail.rows.length > 0) {
      await db.execute({
        sql: `UPDATE drivers SET clerk_user_id = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [clerkId, Number(byEmail.rows[0].id)],
      })
      console.log(`[Driver Auth] Linked existing driver (${email}) to Clerk user ${clerkId}`)
      const linked = await db.execute({
        sql: `SELECT d.* FROM drivers d WHERE d.clerk_user_id = ?`,
        args: [clerkId],
      })
      await assignDriverRole(db, clerkId, {
        email: linked.rows[0]?.email as string | null | undefined,
        name: linked.rows[0]?.name as string | null | undefined,
      })
      return linked.rows[0] as unknown as DriverProfile
    }
  }

  // 4. Auto-create onboarding driver profile in DB (status='inactive', profile_complete=0).
  // Dispatch queries require status='available', so incomplete profiles never receive trips until completed.
  await db.execute({
    sql: `INSERT OR IGNORE INTO drivers (
            clerk_user_id, name, phone, email, vehicle, plate, category,
            status, rating, languages, experience_level, profile_complete,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, '', '', 'standard', 'inactive', 5.0, 'Spanish', 'Standard', 0, datetime('now'), datetime('now'))`,
    args: [clerkId, name, phone, email || null],
  })

  const created = await db.execute({
    sql: `SELECT d.* FROM drivers d WHERE d.clerk_user_id = ?`,
    args: [clerkId],
  })

  if (created.rows.length === 0) {
    throw new Error('DRIVER_NOT_FOUND')
  }

  console.log(`[Driver Auth] Auto-registered onboarding driver profile for Clerk user ${clerkId} (${email || name})`)
  await assignDriverRole(db, clerkId, { email, name })
  return created.rows[0] as unknown as DriverProfile
}
