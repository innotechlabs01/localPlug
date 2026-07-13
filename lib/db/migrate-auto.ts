import { getDb } from '@/lib/db'
import { ensurePlansSchema } from './migrate-plans'

let _migrated = false

const MODULES = [
  { name: 'Dashboard', slug: 'dashboard', icon: 'LayoutDashboard', sort: 1 },
  { name: 'Dispatch', slug: 'dispatch', icon: 'Truck', sort: 2 },
  { name: 'Reservations', slug: 'reservations', icon: 'CalendarCheck', sort: 3 },
  { name: 'Drivers', slug: 'drivers', icon: 'Users', sort: 4 },
  { name: 'Fleet', slug: 'fleet', icon: 'Car', sort: 5 },
  { name: 'Customers', slug: 'customers', icon: 'UserCircle', sort: 6 },
  { name: 'Support', slug: 'support', icon: 'MessageSquare', sort: 7 },
  { name: 'Team', slug: 'employees', icon: 'Building2', sort: 8 },
  { name: 'Analytics', slug: 'analytics', icon: 'BarChart3', sort: 9 },
  { name: 'Payments', slug: 'payments', icon: 'CreditCard', sort: 10 },
  { name: 'Settings', slug: 'settings', icon: 'Settings', sort: 11 },
  { name: 'Roles & Permissions', slug: 'roles', icon: 'Shield', sort: 12 },
  { name: 'Agenda', slug: 'agenda', icon: 'Calendar', sort: 13 },
  { name: 'Cases', slug: 'cases', icon: 'FolderOpen', sort: 14 },
  { name: 'Hotels', slug: 'hotels', icon: 'Building', sort: 15 },
]

const DEFAULT_PERMISSIONS: Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }> = {
  admin:     { view: true,  create: true,  update: true,  delete: true  },
  manager:   { view: true,  create: true,  update: true,  delete: false },
  concierge: { view: true,  create: true,  update: true,  delete: false },
  viewer:    { view: true,  create: false, update: false, delete: false },
}

const RESTRICTED_MODULES: Record<string, Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }>> = {
  employees: {
    manager:   { view: true, create: false, update: false, delete: false },
    concierge: { view: false, create: false, update: false, delete: false },
    viewer:    { view: false, create: false, update: false, delete: false },
  },
  payments: {
    concierge: { view: false, create: false, update: false, delete: false },
    viewer:    { view: false, create: false, update: false, delete: false },
  },
  settings: {
    concierge: { view: false, create: false, update: false, delete: false },
    viewer:    { view: false, create: false, update: false, delete: false },
  },
  roles: {
    manager:   { view: false, create: false, update: false, delete: false },
    concierge: { view: false, create: false, update: false, delete: false },
    viewer:    { view: false, create: false, update: false, delete: false },
  },
  analytics: {
    concierge: { view: true, create: false, update: false, delete: false },
  },
}

export async function ensureSchema(): Promise<void> {
  if (_migrated) return

  const db = getDb()

  const tableCheck = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='modules'`)
  const needsMigration = tableCheck.rows.length === 0

  if (!needsMigration) {
    _migrated = true
    return
  }

  console.log('[Schema] Running auto-migration...')

  await db.execute(`
    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      can_view INTEGER DEFAULT 0,
      can_create INTEGER DEFAULT 0,
      can_update INTEGER DEFAULT 0,
      can_delete INTEGER DEFAULT 0,
      UNIQUE(role_id, module_id)
    )
  `)

  const roleResult = await db.execute('SELECT id, name FROM roles')
  const roleMap: Record<string, number> = {}
  for (const row of roleResult.rows) {
    roleMap[row.name as string] = row.id as number
  }

  if (!roleMap.admin) {
    await db.execute("INSERT INTO roles (name, description) VALUES ('admin', 'Super administrator with full access')")
    roleMap.admin = 1
  }
  if (!roleMap.manager) {
    await db.execute("INSERT INTO roles (name, description) VALUES ('manager', 'Manager with operational access')")
    roleMap.manager = 2
  }
  if (!roleMap.concierge) {
    await db.execute("INSERT INTO roles (name, description) VALUES ('concierge', 'Concierge for daily operations')")
    roleMap.concierge = 3
  }
  if (!roleMap.viewer) {
    await db.execute("INSERT INTO roles (name, description) VALUES ('viewer', 'Read-only access')")
    roleMap.viewer = 4
  }
  if (!roleMap.hotel_manager) {
    await db.execute("INSERT INTO roles (name, description) VALUES ('hotel_manager', 'Hotel manager with access to their hotel dashboard')")
    roleMap.hotel_manager = 5
  }

  const reFetch = await db.execute('SELECT id, name FROM roles')
  for (const row of reFetch.rows) {
    roleMap[row.name as string] = row.id as number
  }

  for (const mod of MODULES) {
    const existing = await db.execute({
      sql: 'SELECT id FROM modules WHERE slug = ?',
      args: [mod.slug],
    })
    if (existing.rows.length === 0) {
      const desc = `${mod.name} module`
      await db.execute({
        sql: 'INSERT INTO modules (name, slug, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
        args: [mod.name, mod.slug, desc, mod.icon, mod.sort],
      })
    }
  }

  const modules = await db.execute('SELECT id, slug FROM modules')
  const moduleMap: Record<string, number> = {}
  for (const row of modules.rows) {
    moduleMap[row.slug as string] = row.id as number
  }

  for (const [roleName, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
    const roleId = roleMap[roleName]
    if (!roleId) continue

    for (const [slug, modId] of Object.entries(moduleMap)) {
      const restricted = RESTRICTED_MODULES[slug]?.[roleName]
      let effectivePerms = perms

      if (restricted) {
        effectivePerms = restricted
      }

      await db.execute({
        sql: `INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          roleId,
          modId,
          effectivePerms.view ? 1 : 0,
          effectivePerms.create ? 1 : 0,
          effectivePerms.update ? 1 : 0,
          effectivePerms.delete ? 1 : 0,
        ],
      })
    }
  }

  console.log('[Schema] Auto-migration complete')

  await ensurePlansSchema()

  _migrated = true
}
