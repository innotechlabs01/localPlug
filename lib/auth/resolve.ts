import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

export type PortalRole = 'admin' | 'hotel_manager' | 'driver'

export interface ResolvedUser {
  id: number
  clerk_id: string
  name: string
  email: string
  role_id: number
  role_name: PortalRole
  hotel_id: number | null
  status: string
}

export interface ResolveResult {
  user: ResolvedUser
  clerkId: string
}

/**
 * Centralized user resolution.
 *
 * 1. Look up users by clerk_id (fast path).
 * 2. If missing, fetch the primary email from Clerk and link by email
 *    (heals deleted/recreated Clerk accounts — the root cause of the
 *    "Access Restricted" breakage).
 * 3. If still missing, return a clear contact_admin error (NO silent
 *    viewer auto-registration).
 */
export async function resolveCurrentUser(): Promise<ResolveResult | { error: string; status: number }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return { error: 'Unauthorized', status: 401 }
  }

  const db = getDb()

  // Fast path: lookup by clerk_id
  let rows = await db.execute({
    sql: `SELECT u.id, u.clerk_id, u.name, u.email, u.role_id, u.hotel_id, u.status,
                 r.name AS role_name
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.clerk_id = ? AND u.status = 'active'`,
    args: [clerkId],
  })

  // Slow path: link by email when clerk_id was rotated (deleted/recreated)
  if (rows.rows.length === 0) {
    let email = ''
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(clerkId)
      email = clerkUser.primaryEmailAddress?.emailAddress || ''
    } catch {
      // Clerk fetch failed — can't link
    }

    if (email) {
      const byEmail = await db.execute({
        sql: `SELECT u.id, u.clerk_id, u.name, u.email, u.role_id, u.hotel_id, u.status,
                     r.name AS role_name
              FROM users u
              JOIN roles r ON u.role_id = r.id
              WHERE u.email = ? AND u.status = 'active'`,
        args: [email],
      })

      if (byEmail.rows.length > 0) {
        // Link the new Clerk account to the existing DB row
        await db.execute({
          sql: `UPDATE users SET clerk_id = ?, updated_at = datetime('now') WHERE id = ?`,
          args: [clerkId, byEmail.rows[0].id as number],
        })
        console.log(`[Auth] Linked new Clerk account ${clerkId} to existing user ${byEmail.rows[0].id} via email ${email}`)
        rows = byEmail
      }
    }
  }

  if (rows.rows.length === 0) {
    return { error: 'contact_admin', status: 403 }
  }

  const row = rows.rows[0]
  const user: ResolvedUser = {
    id: row.id as number,
    clerk_id: row.clerk_id as string,
    name: row.name as string,
    email: row.email as string,
    role_id: row.role_id as number,
    role_name: (row.role_name as PortalRole) || 'driver',
    hotel_id: row.hotel_id as number | null,
    status: row.status as string,
  }

  return { user, clerkId }
}

/**
 * Ensure the current user has the expected portal role.
 * Returns the resolved user if the role matches, or an error otherwise.
 */
export async function requirePortalRole(expected: PortalRole): Promise<ResolveResult | { error: string; status: number }> {
  const result = await resolveCurrentUser()
  if ('error' in result) return result

  if (result.user.role_name !== expected) {
    return { error: 'wrong_portal', status: 403 }
  }

  return result
}
