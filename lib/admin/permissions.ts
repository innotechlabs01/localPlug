import { auth, clerkClient } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/db/migrate-auto'

export type PermissionAction = 'view' | 'create' | 'update' | 'delete'

export type ModulePermissions = Record<string, {
  can_view: boolean
  can_create: boolean
  can_update: boolean
  can_delete: boolean
}>

// TODO: Remove hardcoded super-admin email once ADMIN_EMAILS is configured across all environments.
export const BUILTIN_SUPER_ADMINS = ['anthonyrivera51@gmail.com']

export function isSuperAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return BUILTIN_SUPER_ADMINS.includes(normalized)
}

export async function isSuperAdminClerkUser(clerkId: string): Promise<boolean> {
  await ensureSchema()
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT u.email, r.name as role_name
          FROM users u LEFT JOIN roles r ON u.role_id = r.id
          WHERE u.clerk_id = ? AND u.status = 'active' LIMIT 1`,
    args: [clerkId],
  })
  if (res.rows.length > 0) {
    const email = String(res.rows[0].email || '')
    if (isSuperAdminEmail(email)) return true
  }
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkId)
    const email = clerkUser.primaryEmailAddress?.emailAddress || ''
    return isSuperAdminEmail(email)
  } catch {
    return false
  }
}

export async function requireSuperAdmin(): Promise<NextResponse | undefined> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const ok = await isSuperAdminClerkUser(clerkId)
  if (!ok) {
    return NextResponse.json(
      { error: 'Forbidden: Only Super Admin (anthonyrivera51@gmail.com) can manage roles and permissions' },
      { status: 403 },
    )
  }
}

function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  if (BUILTIN_SUPER_ADMINS.includes(normalized)) return true
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(normalized)
}

export async function getUserPermissions(clerkId: string): Promise<ModulePermissions | null> {
  await ensureSchema()

  const db = getDb()

  let user = await db.execute({
    sql: `SELECT u.id, u.role_id, r.name as role_name, u.email
          FROM users u LEFT JOIN roles r ON u.role_id = r.id
          WHERE u.clerk_id = ? AND u.status = 'active'`,
    args: [clerkId],
  })

  if (!user.rows.length) {
    const roles = await db.execute("SELECT id FROM roles WHERE name = 'viewer'")
    if (!roles.rows.length) return null

    const viewerRoleId = roles.rows[0].id as number

    let name = 'User'
    let email = ''
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(clerkId)
      name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.primaryEmailAddress?.emailAddress || 'User'
      email = clerkUser.primaryEmailAddress?.emailAddress || ''
    } catch { /* clerk fetch may fail */ }

    const targetRoleName = isSuperAdminEmail(email) ? 'super_admin' : isAdminEmail(email) ? 'admin' : 'viewer'
    const targetRoleRes = await db.execute({ sql: 'SELECT id FROM roles WHERE name = ? LIMIT 1', args: [targetRoleName] })
    const roleId = (targetRoleRes.rows[0]?.id as number | undefined) ?? (isAdminEmail(email) ? 1 : viewerRoleId)

    // Link pre-created employee record by email if present (preserves role assigned by Super Admin)
    const preCreated = email
      ? await db.execute({
          sql: 'SELECT id, role_id FROM users WHERE LOWER(email) = ? LIMIT 1',
          args: [email.trim().toLowerCase()],
        })
      : { rows: [] }

    if (preCreated.rows.length > 0) {
      await db.execute({
        sql: `UPDATE users SET clerk_id = ?, name = COALESCE(NULLIF(name, ''), ?), updated_at = datetime('now') WHERE id = ?`,
        args: [clerkId, name, preCreated.rows[0].id as number],
      })
    } else {
      await db.execute({
        sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, password_hash, role_id, status, created_at, updated_at)
              VALUES (?, ?, ?, '', ?, 'active', datetime('now'), datetime('now'))`,
        args: [clerkId, name, email, roleId],
      })
    }

    const newUser = await db.execute({
      sql: 'SELECT id FROM users WHERE clerk_id = ?',
      args: [clerkId],
    })
    if (newUser.rows.length > 0) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
        args: [newUser.rows[0].id as number, roleId],
      })
    }

    console.log(`[Permissions] Auto-registered user ${clerkId} (${name}) as ${isAdminEmail(email) ? 'admin' : 'viewer'}`)

    // Also set Clerk private_metadata so role is visible in Clerk Dashboard
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || ''
    if (CLERK_SECRET_KEY) {
      try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(clerkId, {
          privateMetadata: { role: isAdminEmail(email) ? 'admin' : 'viewer' },
        })
      } catch { /* non-critical */ }
    }

    user = await db.execute({
      sql: `SELECT u.id, u.role_id, r.name as role_name, u.email
            FROM users u LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.clerk_id = ? AND u.status = 'active'`,
      args: [clerkId],
    })

    if (!user.rows.length) return null
  }

  const userRow = user.rows[0] as any
  const roleName = userRow.role_name as string
  const currentRoleId = userRow.role_id as number
  const userEmail = userRow.email as string

  // Promote to super_admin / admin if email matches BUILTIN_SUPER_ADMINS or ADMIN_EMAILS
  const desiredRoleName = isSuperAdminEmail(userEmail) ? 'super_admin' : 'admin'
  const adminRole = await db.execute({ sql: 'SELECT id FROM roles WHERE name = ? LIMIT 1', args: [desiredRoleName] })
  const adminRoleId = (adminRole.rows[0]?.id as number | undefined) || 1

  if (isAdminEmail(userEmail) && currentRoleId !== adminRoleId) {
    await db.execute({
      sql: `UPDATE users SET role_id = ?, updated_at = datetime('now') WHERE clerk_id = ?`,
      args: [adminRoleId, clerkId],
    })
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || ''
    if (CLERK_SECRET_KEY) {
      try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(clerkId, {
          privateMetadata: { role: 'admin' },
        })
      } catch { /* non-critical */ }
    }
    console.log(`[Permissions] Promoted user to ${desiredRoleName.toUpperCase()}: ${userEmail}`)
  }

  if (roleName === 'super_admin' || roleName === 'admin' || isAdminEmail(userEmail)) {
    const allModules = await db.execute(
      'SELECT slug FROM modules ORDER BY sort_order'
    )
    const result: ModulePermissions = {}
    for (const mod of allModules.rows) {
      result[mod.slug as string] = {
        can_view: true,
        can_create: true,
        can_update: true,
        can_delete: true,
      }
    }
    // Guarantee core admin modules even if the modules table is not yet seeded
    for (const coreSlug of [
      'dashboard', 'dispatch', 'reservations', 'drivers', 'fleet', 'customers',
      'support', 'audit', 'queue', 'employees', 'analytics', 'payments',
      'payouts', 'parking_proofs', 'plans', 'hotels', 'events', 'roles', 'settings', 'orders',
    ]) {
      if (!result[coreSlug]) {
        result[coreSlug] = { can_view: true, can_create: true, can_update: true, can_delete: true }
      }
    }
    return result
  }

  const roleId = user.rows[0].role_id as number

  const perms = await db.execute({
    sql: `SELECT m.slug, rp.can_view, rp.can_create, rp.can_update, rp.can_delete
          FROM role_permissions rp
          JOIN modules m ON rp.module_id = m.id
          WHERE rp.role_id = ?`,
    args: [roleId],
  })

  const result: ModulePermissions = {}
  for (const row of perms.rows) {
    result[row.slug as string] = {
      can_view: !!(row.can_view as number),
      can_create: !!(row.can_create as number),
      can_update: !!(row.can_update as number),
      can_delete: !!(row.can_delete as number),
    }
  }

  return result
}

export async function checkPermission(
  clerkId: string,
  moduleSlug: string,
  action: PermissionAction,
): Promise<boolean> {
  const perms = await getUserPermissions(clerkId)
  if (!perms) return false

  const mod = perms[moduleSlug]
  if (!mod) return false

  const actionMap: Record<PermissionAction, keyof typeof mod> = {
    view: 'can_view',
    create: 'can_create',
    update: 'can_update',
    delete: 'can_delete',
  }

  return !!mod[actionMap[action]]
}

export async function requirePermission(
  moduleSlug: string,
  action: PermissionAction,
): Promise<NextResponse | undefined> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = await checkPermission(clerkId, moduleSlug, action)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
