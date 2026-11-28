import { describe, expect, it } from 'vitest'
import { canViewMyReservas } from '@/lib/auth/navigation'

describe('canViewMyReservas', () => {
  it('allows customer-facing roles', () => {
    expect(canViewMyReservas('customer')).toBe(true)
    expect(canViewMyReservas('viewer')).toBe(true)
  })

  it('hides reservations from every operational role', () => {
    expect(canViewMyReservas('super_admin')).toBe(false)
    expect(canViewMyReservas('admin')).toBe(false)
    expect(canViewMyReservas('manager')).toBe(false)
    expect(canViewMyReservas('concierge')).toBe(false)
    expect(canViewMyReservas('hotel_manager')).toBe(false)
    expect(canViewMyReservas('driver')).toBe(false)
  })

  it('fails closed for unknown roles', () => {
    expect(canViewMyReservas('unknown_role')).toBe(false)
  })
})
