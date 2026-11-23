import { NextResponse } from 'next/server'
import { getDriverFromSession } from '@/lib/driver/auth'
import { getDb } from '@/lib/db'
import { getDriverBaseTripCompensation, getDriverParkingReimbursement } from '@/lib/settings'

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

    // Per-order compensation: base trip fee + toll, plus parking reimbursement when flagged
    const [base, reinf] = await Promise.all([
      getDriverBaseTripCompensation(),
      getDriverParkingReimbursement(),
    ])

    // Earnings per-order: completed trips earn base, +reinf when parking proof is approved
    const earningsResult = await db.execute({
      sql: `SELECT
              COUNT(*) as completed_count,
              COALESCE(SUM(CASE WHEN o.airport_parking = 1 AND o.parking_proof_status = 'approved' THEN 1 ELSE 0 END), 0) as paid_parking_count
            FROM assignments a
            JOIN orders o ON a.order_id = o.id
            WHERE a.driver_id = ? AND a.status = 'completed'`,
      args: [driverId],
    })
    const completedAssignments = Number(earningsResult.rows[0]?.completed_count || 0)
    const paidParkingAssignments = Number(earningsResult.rows[0]?.paid_parking_count || 0)
    const earnings = Math.round((completedAssignments * base + paidParkingAssignments * reinf) * 100) / 100

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
        commissionRate: Number(result.driver.commission_rate) || 30,
        tripCompensation: base,
        completedTrips: completedAssignments,
        acceptanceRate,
      },
      packageBreakdown: packageBreakdown.rows,
    })
  } catch (err) {
    console.error('[Driver Metrics]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
