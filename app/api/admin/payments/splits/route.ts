import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError

  const db = getDb()

  // Get split payment summary
  const result = await db.execute(`
    SELECT 
      COUNT(*) as total_payments,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'completed' THEN platform_fee_cents ELSE 0 END) as total_platform_fees,
      SUM(CASE WHEN status = 'completed' THEN hotel_payout_cents ELSE 0 END) as total_hotel_payouts,
      SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as total_refunds,
      COUNT(CASE WHEN split_status = 'completed' THEN 1 END) as split_completed,
      COUNT(CASE WHEN split_status = 'pending' THEN 1 END) as split_pending,
      COUNT(CASE WHEN split_status = 'failed' THEN 1 END) as split_failed
    FROM payments
  `)

  const row = result.rows[0]

  // Get recent split transactions
  const recentResult = await db.execute(`
    SELECT 
      booking_reference,
      package_name,
      amount,
      platform_fee_cents,
      hotel_payout_cents,
      split_status,
      status,
      created_at
    FROM payments 
    WHERE split_status != 'pending'
    ORDER BY created_at DESC 
    LIMIT 20
  `)

  return NextResponse.json({
    summary: {
      totalPayments: Number(row.total_payments),
      totalRevenue: Number(row.total_revenue) / 100,
      totalPlatformFees: Number(row.total_platform_fees) / 100,
      totalHotelPayouts: Number(row.total_hotel_payouts) / 100,
      totalRefunds: Number(row.total_refunds) / 100,
      splitCompleted: Number(row.split_completed),
      splitPending: Number(row.split_pending),
      splitFailed: Number(row.split_failed),
    },
    recentTransactions: recentResult.rows.map(r => ({
      bookingReference: r.booking_reference,
      packageName: r.package_name,
      amount: Number(r.amount) / 100,
      platformFee: Number(r.platform_fee_cents) / 100,
      hotelPayout: Number(r.hotel_payout_cents) / 100,
      splitStatus: r.split_status,
      status: r.status,
      createdAt: r.created_at,
    })),
  })
}
