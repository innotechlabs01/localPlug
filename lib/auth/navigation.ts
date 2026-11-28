import type { PortalRole } from './resolve'

/**
 * Customer-facing roles own reservations. Operational roles must stay in
 * their own portal so the landing page does not offer them a booking-only view.
 */
export function canViewMyReservas(roleName: PortalRole | string): boolean {
  return roleName === 'customer' || roleName === 'viewer'
}
