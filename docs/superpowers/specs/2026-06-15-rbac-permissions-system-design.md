# RBAC Permissions System Design

## Objective
Replace hardcoded `requireRole(['admin', ...])` checks with a fully administrable role-based permission system where:
- Each role has configurable CRUD permissions per module
- Superadmin (existing `admin` role) can manage everything via UI
- New Clerk users auto-register as `viewer` on first access
- Login redirects to `/admin`
- Sidebar shows only permitted modules
- Tables auto-migrate if they don't exist

## Data Model

### New Tables

**modules**
```sql
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**role_permissions**
```sql
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
```

### Existing Tables (no changes)
- `users` — already has `clerk_id`, `role_id`, `status`
- `roles` — already has `id`, `name`, `description`
- `user_roles` — already exists

## Modules & Default Permissions

| slug | name | admin | manager | concierge | viewer |
|------|------|-------|---------|-----------|--------|
| dashboard | Dashboard | CRUD | R | R | R |
| dispatch | Dispatch | CRUD | CRU | CRU | R |
| reservations | Reservations | CRUD | CRU | CRU | R |
| drivers | Drivers | CRUD | CRU | CRU | R |
| fleet | Fleet | CRUD | CRU | CRU | R |
| customers | Customers | CRUD | CRU | CRU | R |
| support | Support / Chat | CRUD | CRU | CRU | R |
| employees | Team | CRUD | R | — | — |
| analytics | Analytics | CRUD | R | R | R |
| payments | Payments | CRUD | R | — | — |
| settings | Settings | CRUD | CRU | — | — |
| roles | Roles & Permissions | CRUD | — | — | — |
| agenda | Agenda | CRUD | CRU | CRU | R |
| cases | Cases | CRUD | CRU | CRU | R |

## Implementation Steps

### 1. Auto-migration (`lib/db/migrate-auto.ts`)
- Run on first DB access (stateless check — just test if `modules` table exists)
- Create `modules` and `role_permissions` tables if missing
- Seed modules data
- Seed default role_permissions for admin/manager/concierge/viewer
- Ensure admin role exists with id=1

### 2. Permission helper (`lib/admin/permissions.ts`)
- `getUserPermissions(clerkId)` — returns all module->CRUD for current user
- `checkPermission(clerkId, moduleSlug, action)` — shorthand for route guards
- `requirePermission(moduleSlug, action)` — Next.js route guard similar to requireRole

### 3. Update `requireRole()` to auto-register
- If user not found in DB, auto-create with role_id=4 (viewer), status='active'
- Then proceed with permission check

### 4. API endpoints
- `GET /api/admin/modules` — list modules (admin only)
- `GET /api/admin/permissions` — full matrix (role_id x module_id) with permissions
- `PUT /api/admin/permissions` — update permission for a role+module
- `GET /api/admin/permissions/mine` — current user's permissions (for sidebar filter)

### 5. New admin page: `/admin/roles`
- Two views: role management (existing) + permission matrix
- Permission matrix: table with roles as columns, modules as rows, CRUD checkboxes per cell
- Only visible to `admin` role

### 6. Dynamic sidebar
- Layout calls `/api/admin/permissions/mine`
- Filters visible nav items by `can_view`
- Hides entire sections if no module visible

### 7. Login redirect
- `app/layout.tsx`: `<ClerkProvider afterSignInUrl="/admin">`
- All authenticated users go to `/admin` after sign-in
- Unauthorized access redirects to `/sign-in`

## Route Guard Migration
Replace all `requireRole(['admin', ...])` calls with `requirePermission('moduleSlug', 'action')`:
- `payments/refund` → `requirePermission('payments', 'delete')`
- `reservations POST` → `requirePermission('reservations', 'create')`
- `dispatch PUT` → `requirePermission('dispatch', 'update')`
- etc.

## Auto-Registration Flow
```
1. Clerk user authenticates
2. Hits any admin route
3. requirePermission() runs:
   a. Get clerk_id from Clerk auth()
   b. Query `users` WHERE clerk_id = ?
   c. Not found → INSERT INTO users (clerk_id, role_id=4, status='active')
   d. INSERT INTO user_roles (user_id, role_id=4)
   e. Query permissions for viewer role
4. Check permission → proceed or 403
```

## Security
- `admin` role (id=1) is special-cased: bypasses permission checks (has implicit CRUD on all)
- The `/api/admin/permissions` endpoints require `admin` role
- Sidebar filtering is cosmetic — real enforcement is server-side in API routes
