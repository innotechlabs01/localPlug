-- Migration: RBAC Modules & Configurable Permissions
-- Created: 2026-06-15
-- Drops old permissions/role_permissions schema, creates modules + CRUD-based role_permissions

-- Drop old schema
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;

-- Modules table: each module = a section in the admin sidebar
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- New role_permissions: CRUD flags per role per module
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  can_view INTEGER DEFAULT 0,
  can_create INTEGER DEFAULT 0,
  can_update INTEGER DEFAULT 0,
  can_delete INTEGER DEFAULT 0,
  UNIQUE(role_id, module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_perms_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_perms_module ON role_permissions(module_id);

-- Seed 14 modules
INSERT OR IGNORE INTO modules (name, slug, description, icon, sort_order) VALUES
  ('Dashboard', 'dashboard', 'Executive dashboard & KPIs', 'LayoutDashboard', 1),
  ('Dispatch', 'dispatch', 'Driver assignment & dispatch tracking', 'Truck', 2),
  ('Reservations', 'reservations', 'Booking management', 'CalendarCheck', 3),
  ('Drivers', 'drivers', 'Driver profiles & documents', 'Users', 4),
  ('Fleet', 'fleet', 'Vehicle fleet management', 'Car', 5),
  ('Customers', 'customers', 'Customer CRM', 'UserCircle', 6),
  ('Support', 'support', 'AI chat & support tickets', 'MessageSquare', 7),
  ('Employees', 'employees', 'Staff & team management', 'Building2', 8),
  ('Analytics', 'analytics', 'Reports & analytics', 'BarChart3', 9),
  ('Payments', 'payments', 'Payment tracking & refunds', 'CreditCard', 10),
  ('Settings', 'settings', 'System configuration', 'Settings', 11),
  ('Roles & Permissions', 'roles', 'Role & permission matrix', 'Shield', 12),
  ('Agenda', 'agenda', 'Daily arrival agenda', 'Calendar', 13),
  ('Cases', 'cases', 'Case management', 'FolderOpen', 14);

-- Seed default permissions
-- Admin: full CRUD on all modules
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 1, id, 1, 1, 1, 1 FROM modules;

-- Manager: CRUD on most, view-only on employees/roles, no delete on some
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 2, id, 1, 1, 1, 0 FROM modules WHERE slug NOT IN ('employees', 'roles');
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 2, id, 1, 0, 0, 0 FROM modules WHERE slug IN ('employees');

-- Concierge: CRU on operational modules, no access to employees/payments/settings/roles
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 3, id, 1, 1, 1, 0 FROM modules WHERE slug IN ('dashboard','dispatch','reservations','drivers','fleet','customers','support','agenda','cases');
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 3, id, 1, 0, 0, 0 FROM modules WHERE slug = 'analytics';

-- Viewer: read-only on limited modules
INSERT OR IGNORE INTO role_permissions (role_id, module_id, can_view, can_create, can_update, can_delete)
SELECT 4, id, 1, 0, 0, 0 FROM modules WHERE slug IN ('dashboard','reservations','dispatch','drivers','fleet','customers','support','agenda','cases','analytics');
