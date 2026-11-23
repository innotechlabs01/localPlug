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
    sql: 'SELECT id FROM role_permissions WHERE role_id = ? AND module_id = ?',
    args: [role_id, module_id],
  })

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE role_permissions SET can_view = ?, can_create = ?, can_update = ?, can_delete = ? WHERE role_id = ? AND module_id = ?`,
      args: [
        can_view ? 1 : 0,
        can_create ? 1 : 0,
        can_update ? 1 : 0,
        can_delete ? 1 : 0,
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
