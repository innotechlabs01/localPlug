// Clerk infrastructure helpers — server/client safe, no DB deps.
// Part of @lp/auth (B5A). Runtime boundary: Clerk only, zero database.

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'

// ─── Re-exports from @clerk/nextjs/server ───
export { auth, currentUser, clerkClient }

// ─── Typed user object (subset we use) ───
export interface AuthUser {
  id: string
  emailAddresses: { emailAddress: string }[]
  firstName: string | null
  lastName: string | null
  publicMetadata: Record<string, unknown>
  privateMetadata: Record<string, unknown>
  unsafeMetadata: Record<string, unknown>
}

// ─── Get typed user (server) ───
export async function getAuthUser(): Promise<AuthUser | null> {
  const user = await currentUser()
  if (!user) return null
  return {
    id: user.id,
    emailAddresses: user.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
    firstName: user.firstName,
    lastName: user.lastName,
    publicMetadata: user.publicMetadata,
    privateMetadata: user.privateMetadata,
    unsafeMetadata: user.unsafeMetadata,
  }
}

// ─── Get user ID from auth() ───
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

// ─── Require authenticated user (throws if not auth) ───
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    const err = new Error('Unauthorized') as Error & { status: number }
    err.status = 401
    throw err
  }
  return user
}

// ─── Check if user has specific publicMetadata role ───
export function hasRole(user: AuthUser, role: string): boolean {
  return (user.publicMetadata?.role as string) === role
}

// ─── Get user's publicMetadata role ───
export function getUserRole(user: AuthUser): string | undefined {
  return user.publicMetadata?.role as string | undefined
}