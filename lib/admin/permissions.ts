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

// Todos los permisos provienen de la tabla role_permissions (configurables por BD/UI).
// No existen emails hardcodeados ni bypass por rol nombre. El rol super_admin se
// resuelve exclusivamente contra la tabla roles.

export async function isSuperAdminClerkUser(clerkId: string): Promise<boolean> {
  await ensureSchema()
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT r.name as role_name
          FROM users u LEFT JOIN roles r ON u.role_id = r.id
          WHERE u.clerk_id = ? AND u.status = 'active' LIMIT 1`,
    args: [clerkId],
  })
  return res.rows.length > 0 && String(res.rows[0].role_name) === 'super_admin'
}

export async function requireSuperAdmin(): Promise<NextResponse | undefined> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const ok = await isSuperAdminClerkUser(clerkId)
  if (!ok) {
    return NextResponse.json(
      { error: 'Forbidden: Only Super Admin can manage roles and permissions' },
      { status: 403 },
    )
  }
}

export async function getUserPermissions(clerkId: string): Promise<ModulePermissions | null> {
  await ensureSchema()

  const db = getDb()

  let user = await db.execute({
    sql: `SELECT u.id, u.role_id, u.status, r.name as role_name, u.email
          FROM users u LEFT JOIN roles r ON u.role_id = r.id
          WHERE u.clerk_id = ? LIMIT 1`,
    args: [clerkId],
  })

  // A deleted/recreated Clerk account may leave the DB row inactive. The
  // webhook heals it asynchronously; heal it here as well so login is not
  // blocked while the webhook is pending.
  if (user.rows.length > 0 && user.rows[0].status === 'inactive') {
    await db.execute({
      sql: `UPDATE users SET status = 'active', updated_at = datetime('now') WHERE id = ?`,
      args: [user.rows[0].id as number],
    })
    user = await db.execute({
      sql: `SELECT u.id, u.role_id, u.status, r.name as role_name, u.email
            FROM users u LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.clerk_id = ? AND u.status = 'active'`,
      args: [clerkId],
    })
  }

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

    // Link pre-created employee record by email if present (preserves role assigned by Super Admin)
    const preCreated = email
      ? await db.execute({
          sql: 'SELECT id, role_id, status FROM users WHERE LOWER(email) = ? LIMIT 1',
          args: [email.trim().toLowerCase()],
        })
      : { rows: [] }

    let roleId = viewerRoleId
    if (preCreated.rows.length > 0) {
      roleId = (preCreated.rows[0].role_id as number | null) ?? viewerRoleId
      const nextStatus = preCreated.rows[0].status === 'inactive' ? 'active' : preCreated.rows[0].status
      await db.execute({
        sql: `UPDATE users
              SET clerk_id = ?, name = COALESCE(NULLIF(name, ''), ?), email = ?, status = ?,
                  updated_at = datetime('now')
              WHERE id = ?`,
        args: [clerkId, name, email, nextStatus, preCreated.rows[0].id as number],
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

    console.log(`[Permissions] Auto-registered user ${clerkId} (${name}) as viewer`)

    user = await db.execute({
      sql: `SELECT u.id, u.role_id, r.name as role_name, u.email
            FROM users u LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.clerk_id = ? AND u.status = 'active'`,
      args: [clerkId],
    })

    if (!user.rows.length) return null
  }

  const userRow = user.rows[0] as any
  const roleId = userRow.role_id as number

  // Siempre consultar role_permissions de la BD según el role_id del usuario.
  // No hay bypass CRUD total por rol nombre ni por email.
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

// No-op mantenido por compatibilidad: Clerk se usa únicamente para inicio de sesión
// y la Base de Datos (users + roles + role_permissions) es la única fuente de verdad.
export async function syncClerkUserRole(_clerkId: string, _roleName: string): Promise<void> {
  return
}
