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

export async function getUserPermissions(clerkId: string): Promise<ModulePermissions | null> {
  await ensureSchema()

  const db = getDb()

  let user = await db.execute({
    sql: `SELECT u.id, u.role_id, r.name as role_name
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

    await db.execute({
      sql: `INSERT OR IGNORE INTO users (clerk_id, name, email, role_id, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
      args: [clerkId, name, email, viewerRoleId],
    })

    const newUser = await db.execute({
      sql: 'SELECT id FROM users WHERE clerk_id = ?',
      args: [clerkId],
    })
    if (newUser.rows.length > 0) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
        args: [newUser.rows[0].id as number, viewerRoleId],
      })
    }

    console.log(`[Permissions] Auto-registered user ${clerkId} (${name}) as viewer`)

    user = await db.execute({
      sql: `SELECT u.id, u.role_id, r.name as role_name
            FROM users u LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.clerk_id = ? AND u.status = 'active'`,
      args: [clerkId],
    })

    if (!user.rows.length) return null
  }

  const roleName = user.rows[0].role_name as string

  if (roleName === 'admin') {
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
