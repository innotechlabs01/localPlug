import { NextResponse } from 'next/server'
import { getDriverFromSession } from '@/lib/driver/auth'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const db = getDb()
    const driverId = result.driver.id

    // Total assignments
    const totalResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM assignments WHERE driver_id = ?`,
      args: [driverId],
    })
    const total = Number(totalResult.rows[0].total) || 0

    // Completed assignments
    const completedResult = await db.execute({
      sql: `SELECT COUNT(*) as completed FROM assignments WHERE driver_id = ? AND status = 'completed'`,
      args: [driverId],
    })
    const completed = Number(completedResult.rows[0].completed) || 0

    // Pending assignments
    const pendingResult = await db.execute({
      sql: `SELECT COUNT(*) as pending FROM assignments WHERE driver_id = ? AND status = 'pending_acceptance'`,
      args: [driverId],
    })
    const pending = Number(pendingResult.rows[0].pending) || 0

    // Active assignments
    const activeResult = await db.execute({
      sql: `SELECT COUNT(*) as active FROM assignments WHERE driver_id = ? AND status = 'accepted'`,
      args: [driverId],
    })
    const active = Number(activeResult.rows[0].active) || 0

    // Earnings (sum of completed order prices * commission rate)
    const commissionRate = Number(result.driver.commission_rate) || 30
    const earningsResult = await db.execute({
      sql: `SELECT COALESCE(SUM(o.package_price), 0) as total_revenue
            FROM assignments a
            JOIN orders o ON a.order_id = o.id
            WHERE a.driver_id = ? AND a.status = 'completed'`,
      args: [driverId],
    })
    const totalRevenue = Number(earningsResult.rows[0].total_revenue) || 0
    const earnings = Math.round(totalRevenue * (commissionRate / 100))

    // Acceptance rate
    const totalDecisions = completed + Number((await db.execute({
      sql: `SELECT COUNT(*) as c FROM assignments WHERE driver_id = ? AND status IN ('declined','cancelled')`,
      args: [driverId],
    })).rows[0].c) || 0
    const acceptanceRate = totalDecisions > 0 ? Math.round((completed / totalDecisions) * 100) : 0

    // Recent breakdown by package
    const packageBreakdown = await db.execute({
      sql: `SELECT o.package_name, COUNT(*) as count
            FROM assignments a
            JOIN orders o ON a.order_id = o.id
            WHERE a.driver_id = ? AND a.status = 'completed'
            GROUP BY o.package_name
            ORDER BY count DESC
            LIMIT 5`,
      args: [driverId],
    })

    return NextResponse.json({
      stats: {
        total,
        completed,
        pending,
        active,
        earnings,
        acceptanceRate,
        commissionRate,
      },
      packageBreakdown: packageBreakdown.rows,
    })
  } catch (err) {
    console.error('[Driver Metrics]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
