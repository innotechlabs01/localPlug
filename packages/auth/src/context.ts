// Auth context — typed access to current user in Server Components / Actions.
// Part of @lp/auth (B5A). No DB deps.

import { auth, currentUser } from '@clerk/nextjs/server'

export interface AuthContext {
  userId: string | null
  sessionId: string | null
  orgId: string | null
}

// ─── Get auth context (safe in any Server Component/Action) ───
export async function getAuthContext(): Promise<AuthContext> {
  const { userId, sessionId, orgId } = await auth()
  return { userId, sessionId: sessionId ?? null, orgId: orgId ?? null }
}

// ─── Require auth context (throws if unauthenticated) ───
export async function requireAuthContext(): Promise<Required<AuthContext>> {
  const { userId, sessionId, orgId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized: no active session')
  }
  return { userId, sessionId: sessionId!, orgId: orgId! }
}

// ─── Get full Clerk user object ───
export async function getClerkUser() {
  return await currentUser()
}

// ─── Check if user has role in publicMetadata ───
export async function hasRoleAsync(role: string): Promise<boolean> {
  const user = await currentUser()
  if (!user) return false
  return user.publicMetadata?.role === role
}

// ─── Check if user has any of the allowed roles ───
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const user = await currentUser()
  if (!user) return false
  const userRole = user.publicMetadata?.role as string | undefined
  return userRole !== undefined && roles.includes(userRole)
}

// ─── Get user's publicMetadata (typed) ───
export interface UserPublicMetadata {
  role?: string
  [key: string]: unknown
}

export async function getPublicMetadata(): Promise<UserPublicMetadata | null> {
  const user = await currentUser()
  return (user?.publicMetadata as UserPublicMetadata) ?? null
}

// ─── Check if user is admin ───
export async function isAdmin(): Promise<boolean> {
  return await hasRoleAsync('admin')
}

// ─── Check if user is hotel manager ───
export async function isHotelManager(): Promise<boolean> {
  return await hasAnyRole(['admin', 'hotel_manager'])
}