import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/rides/pricing/route'

const { mockGetTaxRate, mockEnsureRidePricingTable } = vi.hoisted(() => ({
  mockGetTaxRate: vi.fn(),
  mockEnsureRidePricingTable: vi.fn(),
}))

vi.mock('@/lib/settings', () => ({
  getTaxRate: mockGetTaxRate,
}))

vi.mock('@/lib/ride-pricing', () => ({
  ensureRidePricingTable: mockEnsureRidePricingTable,
}))

const pricing = [
  {
    category: 'standard',
    label: 'Standard',
    base_usd: 1.5,
    per_km_usd: 0.65,
    per_min_usd: 0.1,
    min_fare_usd: 3,
    avg_speed_kmh: 28,
    platform_commission_pct: 18,
    regulation_ref: 'Res. 202650004167',
    last_reviewed_at: null,
  },
]

describe('GET /api/rides/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnsureRidePricingTable.mockResolvedValue(pricing)
    mockGetTaxRate.mockResolvedValue('0.19')
  })

  it('returns live super_admin pricing and the validated IVA rate publicly', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      taxRate: 0.19,
      pricing,
    })
  })

  it('fails closed when the configured tax rate is invalid', async () => {
    mockGetTaxRate.mockResolvedValue('999')
    const res = await GET()
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toMatchObject({ success: false })
  })
})
