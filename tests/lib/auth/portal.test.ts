import { describe, expect, it } from 'vitest'
import { portalForRole } from '@/lib/auth/portal'

describe('portalForRole', () => {
  it('routes admin roles to the admin portal', () => {
    expect(portalForRole('admin')).toBe('/admin')
    expect(portalForRole('super_admin')).toBe('/admin')
    expect(portalForRole('manager')).toBe('/admin')
    expect(portalForRole('concierge')).toBe('/admin')
  })

  it('routes operational roles to their own portal', () => {
    expect(portalForRole('driver')).toBe('/driver')
    expect(portalForRole('hotel_manager')).toBe('/hotel')
  })

  it('routes customer-facing roles to their reservations', () => {
    expect(portalForRole('viewer')).toBe('/mis-reservas')
    expect(portalForRole('customer')).toBe('/mis-reservas')
  })

  it('does not invent a portal for unknown roles', () => {
    expect(portalForRole('unknown_role')).toBeNull()
  })
})
