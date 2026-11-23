import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('dashboard', 'view')
  if (authError) return authError
  const db = getDb()

  const [orderStats, revenueStats, payoutStats] = await Promise.all([
    db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM orders
    `),
    db.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue_cents,
        COALESCE(SUM(CASE WHEN status = 'completed' AND date(created_at) = date('now') THEN amount ELSE 0 END), 0) as today_revenue_cents
      FROM payments
    `).catch(() => ({ rows: [{ total_revenue_cents: 0, today_revenue_cents: 0 }] })),
    db.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'available' THEN amount_usd ELSE 0 END), 0) as available_payouts_usd,
        COALESCE(SUM(CASE WHEN status = 'requested' THEN amount_usd ELSE 0 END), 0) as requested_payouts_usd,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_usd ELSE 0 END), 0) as paid_payouts_usd
      FROM payout_ledger
    `).catch(() => ({ rows: [{ available_payouts_usd: 0, requested_payouts_usd: 0, paid_payouts_usd: 0 }] })),
  ])

  const o = orderStats.rows[0] || {}
  const r = revenueStats.rows[0] || {}
  const p = payoutStats.rows[0] || {}

  return NextResponse.json({
    total: Number(o.total || 0),
    new: Number(o.new_count || 0),
    inProgress: Number(o.in_progress || 0),
    urgent: Number(o.urgent || 0),
    completed: Number(o.completed || 0),
    revenueUsd: Math.round(Number(r.total_revenue_cents || 0)) / 100,
    todayRevenueUsd: Math.round(Number(r.today_revenue_cents || 0)) / 100,
    availablePayoutsUsd: Number(p.available_payouts_usd || 0),
    requestedPayoutsUsd: Number(p.requested_payouts_usd || 0),
    paidPayoutsUsd: Number(p.paid_payouts_usd || 0),
  })
}
