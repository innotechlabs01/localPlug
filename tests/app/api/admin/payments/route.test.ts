import { describe, it, expect, vi, afterEach } from 'vitest'
import { GET } from '@/app/api/admin/payments/route'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

vi.mock('@/lib/admin/permissions', () => ({
  requirePermission: vi.fn(() => Promise.resolve(undefined)),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user' })),
}))

vi.mock('@/lib/trm', () => ({
  getTrmRate: vi.fn(() => Promise.resolve(4200)),
  convertCopToUsd: vi.fn((cop: number, rate: number) => Math.round(cop / rate)),
}))

describe('admin payments API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns all KPI values with correct formatting', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ count: 10, total: 100000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 10 }] })
      .mockResolvedValueOnce({ rows: [{ count: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ count: 15, total: 120000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 5, total: 200 }] })
      .mockResolvedValueOnce({ rows: [{ package_name: 'Standard', total: 60000, count: 6 }] })
      .mockResolvedValueOnce({ rows: [{ booking_reference: 'BK-001', amount: 5000, status: 'completed', package_id: 'p1', package_name: 'Standard', currency: 'usd', customer_name: 'John', customer_email: 'j@t.com', customer_phone: '+1', created_at: '2026-06-01', error_message: null }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, order_number: 'ORD-1', booking_reference: 'BK-001', customer_name: 'John', package_name: 'Standard', package_price: 200, currency: 'usd', payment_status: 'completed', assigned_to: 1, created_at: '2026-06-01', driver_name: 'Driver A', driver_vehicle: 'Sedan', driver_plate: 'XYZ', driver_total_trips: 10 }] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.kpis.totalRevenue).toBe(1000)
    expect(json.kpis.successfulCount).toBe(10)
    expect(json.kpis.failedCount).toBe(2)
    expect(json.kpis.pendingCount).toBe(3)
    expect(json.kpis.successfulRate).toBe('83.3')
    expect(json.kpis.failureRate).toBe('16.7')
    expect(json.kpis.driverPayouts).toBe(200)
    expect(json.kpis.driverPayoutsPct).toBe('20')
    expect(json.kpis.stripeBalance).toBe(800)
  })

  it('totalRevenue = completed payments SUM / 100 (payments.amount is cents)', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ count: 1, total: 50000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1, total: 50000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0, total: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    const json = await res.json()

    expect(json.kpis.totalRevenue).toBe(500)
  })

  it('driverPayouts = SUM(package_price) without division (orders.package_price is dollars)', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ count: 1, total: 50000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1, total: 50000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 3, total: 750 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    const json = await res.json()

    expect(json.kpis.driverPayouts).toBe(750)
  })

  it('stripeBalance = totalRevenue - driverPayouts', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ count: 1, total: 100000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1, total: 100000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1, total: 300 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    const json = await res.json()

    expect(json.kpis.stripeBalance).toBe(700)
    expect(json.kpis.stripeBalance).toBe(json.kpis.totalRevenue - json.kpis.driverPayouts)
  })

  it('revenue breakdown by service', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ count: 5, total: 100000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 5 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 5, total: 100000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0, total: 0 }] })
      .mockResolvedValueOnce({ rows: [
        { package_name: 'Premium', total: 60000, count: 3 },
        { package_name: 'Standard', total: 40000, count: 2 },
      ]})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    const json = await res.json()

    expect(json.revenueByService).toHaveLength(2)
    expect(json.revenueByService[0].package_name).toBe('Premium')
    expect(json.revenueByService[0].amount).toBe(600)
    expect(json.revenueByService[0].percentage).toBe('60.0')
    expect(json.revenueByService[1].package_name).toBe('Standard')
    expect(json.revenueByService[1].amount).toBe(400)
    expect(json.revenueByService[1].percentage).toBe('40.0')
  })

  it('transaction list with status filter', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ count: 2, total: 30000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 2 }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 3, total: 35000 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0, total: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [
        { booking_reference: 'BK-001', package_id: 'p1', package_name: 'Premium', amount: 20000, currency: 'usd', status: 'completed', customer_name: 'John', customer_email: 'j@t.com', customer_phone: '+1', created_at: '2026-06-01', error_message: null },
        { booking_reference: 'BK-002', package_id: 'p2', package_name: 'Standard', amount: 10000, currency: 'usd', status: 'completed', customer_name: 'Jane', customer_email: 'ja@t.com', customer_phone: '+2', created_at: '2026-06-02', error_message: null },
        { booking_reference: 'BK-003', package_id: 'p3', package_name: 'Standard', amount: 5000, currency: 'usd', status: 'failed', customer_name: 'Bob', customer_email: 'b@t.com', customer_phone: '+3', created_at: '2026-06-03', error_message: 'Card declined' },
      ]})
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    const json = await res.json()

    expect(json.transactions).toHaveLength(3)
    expect(json.transactions[0].amount).toBe(200)
    expect(json.transactions[0].currency).toBe('USD')
    expect(json.transactions[2].status).toBe('failed')
    expect(json.transactions[2].error_message).toBe('Card declined')
  })

  it('empty data edge case (no payments yet)', async () => {
    const mockExecute = vi.fn()
      .mockResolvedValueOnce({ rows: [{ count: 0, total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0, total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0, total: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    vi.mocked(getDb).mockReturnValue({ execute: mockExecute } as any)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.kpis.totalRevenue).toBe(0)
    expect(json.kpis.successfulCount).toBe(0)
    expect(json.kpis.failedCount).toBe(0)
    expect(json.kpis.driverPayouts).toBe(0)
    expect(json.kpis.stripeBalance).toBe(0)
    expect(json.revenueByService).toHaveLength(0)
    expect(json.transactions).toHaveLength(0)
    expect(json.payouts).toHaveLength(0)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requirePermission).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))

    const res = await GET()
    expect(res.status).toBe(401)
  })
})
