import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('roles', 'view')
  if (authError) return authError

  const db = getDb()

  const roles = await db.execute('SELECT id, name, description FROM roles ORDER BY id')
  const modules = await db.execute('SELECT id, name, slug FROM modules ORDER BY sort_order')
  const permissions = await db.execute(`
    SELECT rp.id, rp.role_id, rp.module_id, rp.can_view, rp.can_create, rp.can_update, rp.can_delete
    FROM role_permissions rp
  `)

  const permMap: Record<string, Record<string, { can_view: number; can_create: number; can_update: number; can_delete: number }>> = {}
  for (const row of permissions.rows) {
    const rId = String(row.role_id)
    const mId = String(row.module_id)
    if (!permMap[rId]) permMap[rId] = {}
    permMap[rId][mId] = {
      can_view: row.can_view as number,
      can_create: row.can_create as number,
      can_update: row.can_update as number,
      can_delete: row.can_delete as number,
    }
  }

  return NextResponse.json({
    roles: roles.rows,
    modules: modules.rows,
    permissions: permMap,
  })
}

export async function PUT(req: Request) {
  const authError = await requirePermission('roles', 'update')
  if (authError) return authError

  const body = await req.json()
  const { role_id, module_id, can_view, can_create, can_update, can_delete } = body

  if (!role_id || !module_id) {
    return NextResponse.json({ error: 'role_id and module_id required' }, { status: 400 })
  }

  const db = getDb()

  const existing = await db.execute({
    sql: 'SELECT id, can_view, can_create, can_update, can_delete FROM role_permissions WHERE role_id = ? AND module_id = ?',
    args: [role_id, module_id],
  })

  if (existing.rows.length > 0) {
    const cur = existing.rows[0] as any
    await db.execute({
      sql: `UPDATE role_permissions SET can_view = ?, can_create = ?, can_update = ?, can_delete = ? WHERE role_id = ? AND module_id = ?`,
      args: [
        can_view !== undefined ? (can_view ? 1 : 0) : Number(cur.can_view || 0),
        can_create !== undefined ? (can_create ? 1 : 0) : Number(cur.can_create || 0),
        can_update !== undefined ? (can_update ? 1 : 0) : Number(cur.can_update || 0),
        can_delete !== undefined ? (can_delete ? 1 : 0) : Number(cur.can_delete || 0),
        role_id,
        module_id,
      ],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        role_id,
        module_id,
        can_view ? 1 : 0,
        can_create ? 1 : 0,
        can_update ? 1 : 0,
        can_delete ? 1 : 0,
      ],
    })
  }

  return NextResponse.json({ success: true })
}

export async function POST(req: Request) {
  const authError = await requirePermission('roles', 'create')
  if (authError) return authError

  const body = await req.json()
  const rawName = String(body.name || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_')
  const description = String(body.description || '').trim()

  if (!rawName) {
    return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
  }

  const db = getDb()
  const dup = await db.execute({ sql: 'SELECT id FROM roles WHERE name = ?', args: [rawName] })
  if (dup.rows.length > 0) {
    return NextResponse.json({ error: 'Role already exists' }, { status: 409 })
  }

  const res = await db.execute({
    sql: 'INSERT INTO roles (name, description) VALUES (?, ?)',
    args: [rawName, description || `${rawName} role`],
  })
  const roleId = Number(res.lastInsertRowid)

  // Initialize module permissions row for each module (view-only by default if requested, else 0)
  const mods = await db.execute('SELECT id FROM modules')
  for (const mod of mods.rows) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
            VALUES (?, ?, 0, 0, 0, 0)`,
      args: [roleId, mod.id as number],
    })
  }

  return NextResponse.json({ success: true, role: { id: roleId, name: rawName, description: description || `${rawName} role` } }, { status: 201 })
}

export async function DELETE(req: Request) {
  const authError = await requirePermission('roles', 'delete')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) {
    return NextResponse.json({ error: 'Role id is required' }, { status: 400 })
  }

  const db = getDb()
  const roleRes = await db.execute({ sql: 'SELECT name FROM roles WHERE id = ?', args: [id] })
  if (!roleRes.rows.length) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }
  const roleName = String(roleRes.rows[0].name)
  if (['super_admin', 'admin', 'viewer'].includes(roleName)) {
    return NextResponse.json({ error: 'Cannot delete core system role' }, { status: 400 })
  }

  await db.execute({ sql: 'DELETE FROM roles WHERE id = ?', args: [id] })
  return NextResponse.json({ success: true })
}
