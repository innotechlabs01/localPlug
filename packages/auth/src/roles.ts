// In-memory role definitions — no DB, no Drizzle.
// Part of @lp/auth (B5A). Used by guards/middleware for RBAC without persistence.

export type RoleName = 'admin' | 'manager' | 'concierge' | 'viewer' | 'driver' | 'customer'

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  admin: 100,
  manager: 80,
  concierge: 60,
  viewer: 40,
  driver: 30,
  customer: 10,
} as const

export function roleLevel(role: RoleName): number {
  return ROLE_HIERARCHY[role] ?? 0
}

export function canAccess(userRole: RoleName, requiredRole: RoleName): boolean {
  return roleLevel(userRole) >= roleLevel(requiredRole)
}

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  admin: ['*'],
  manager: ['bookings:read', 'bookings:write', 'drivers:read', 'drivers:write', 'reports:read'],
  concierge: ['bookings:read', 'bookings:write', 'customers:read'],
  viewer: ['bookings:read', 'reports:read'],
  driver: ['trips:read', 'trips:update_status'],
  customer: ['bookings:own:read', 'bookings:own:write'],
} as const

export function hasPermission(userRole: RoleName, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[userRole] ?? []
  return perms.includes('*') || perms.includes(permission)
}