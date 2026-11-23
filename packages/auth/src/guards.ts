// API route guards — used in route handlers for RBAC.
// Part of @lp/auth (B5A). No DB deps.

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { RoleName, canAccess, hasPermission } from './roles'

export interface GuardResult {
  success: true
  userId: string
  role: RoleName
}

export interface GuardError {
  success: false
  error: NextResponse
}

// ─── Require authentication ───
export async function requireAuthGuard(): Promise<GuardResult | GuardError> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  // Role must come from publicMetadata (set via Clerk dashboard/webhook)
  const user = await import('@clerk/nextjs/server').then((m) => m.currentUser())
  const role = (user?.publicMetadata?.role as RoleName) ?? 'viewer'
  return { success: true, userId, role }
}

// ─── Require specific role or higher ───
export async function requireRole(allowedRoles: RoleName[]): Promise<GuardResult | GuardError> {
  const authResult = await requireAuthGuard()
  if (!authResult.success) return authResult

  const userRole = authResult.role
  if (!allowedRoles.some((r) => canAccess(userRole, r))) {
    return { success: false, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return authResult
}

// ─── Require specific permission ───
export async function requirePermission(permission: string): Promise<GuardResult | GuardError> {
  const authResult = await requireAuthGuard()
  if (!authResult.success) return authResult

  if (!hasPermission(authResult.role, permission)) {
    return { success: false, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return authResult
}

// ─── Admin only ───
export async function requireAdmin(): Promise<GuardResult | GuardError> {
  return requireRole(['admin'])
}

// ─── Hotel manager or admin ───
export async function requireHotelManager(): Promise<GuardResult | GuardError> {
  return requireRole(['admin', 'manager'])
}