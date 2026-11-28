import { resolveCurrentUser, type PortalRole } from './resolve'

export type PortalPath = '/admin' | '/driver' | '/hotel' | '/mis-reservas'

const PORTAL_BY_ROLE: Partial<Record<PortalRole, PortalPath>> = {
  super_admin: '/admin',
  admin: '/admin',
  manager: '/admin',
  concierge: '/admin',
  hotel_manager: '/hotel',
  driver: '/driver',
  customer: '/mis-reservas',
  viewer: '/mis-reservas',
}

/** DB roles own portal routing. Clerk metadata is never read or written here. */
export function portalForRole(roleName: string): PortalPath | null {
  return PORTAL_BY_ROLE[roleName as PortalRole] ?? null
}

export type PortalDestination =
  | { destination: PortalPath; roleName: PortalRole; hotelId: number | null }
  | { error: string; status: number }

export async function resolvePortalDestination(): Promise<PortalDestination> {
  const result = await resolveCurrentUser()
  if ('error' in result) return result

  const destination = portalForRole(result.user.role_name)
  if (!destination) {
    return { error: 'no_portal_role', status: 403 }
  }
  if (destination === '/hotel' && !result.user.hotel_id) {
    return { error: 'hotel_not_found', status: 403 }
  }

  return {
    destination,
    roleName: result.user.role_name,
    hotelId: result.user.hotel_id,
  }
}
