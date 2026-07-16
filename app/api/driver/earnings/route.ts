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

    // Get completed assignments with earnings
    const assignmentsResult = await db.execute({
      sql: `SELECT
              da.id, da.order_id, da.status, da.pickup_date, da.pickup_time,
              o.customer_name, o.package_name, o.package_price, o.currency,
              o.destination_address, o.arrival_date, o.arrival_time,
              o.booking_reference, o.order_number
            FROM driver_assignments da
            JOIN orders o ON da.order_id = o.id
            WHERE da.driver_id = ? AND da.status IN ('completed', 'accepted', 'confirmed_to_client')
            ORDER BY da.created_at DESC
            LIMIT 50`,
      args: [driverId],
    })

    const assignments = (assignmentsResult.rows || []).map((row: any) => {
      const commissionRate = result.driver.commission_rate || 0.30
      const packagePrice = Number(row.package_price) || 0
      const earned = Math.round(packagePrice * commissionRate * 100) / 100

      return {
        id: row.id,
        order_id: row.order_id,
        status: row.status,
        date: row.pickup_date || row.arrival_date || '',
        time: row.pickup_time || row.arrival_time || '',
        customer_name: row.customer_name || 'Cliente',
        package_name: row.package_name || 'Servicio',
        destination: row.destination_address || 'Destino',
        order_number: row.order_number || '',
        booking_reference: row.booking_reference || '',
        amount: packagePrice,
        earned,
      }
    })

    // Calculate weekly stats
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)

    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)
    lastWeekEnd.setHours(0, 0, 0, 0)

    const thisWeekTrips = assignments.filter(a => {
      const d = new Date(a.date)
      return d >= weekStart && a.status === 'completed'
    })
    const lastWeekTrips = assignments.filter(a => {
      const d = new Date(a.date)
      return d >= lastWeekStart && d < lastWeekEnd && a.status === 'completed'
    })

    const thisWeekEarnings = thisWeekTrips.reduce((s, a) => s + a.earned, 0)
    const lastWeekEarnings = lastWeekTrips.reduce((s, a) => s + a.earned, 0)
    const weeklyChange = lastWeekEarnings > 0
      ? Math.round(((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100)
      : 0

    // Last 7 days breakdown
    const dailyEarnings: { date: string; amount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayEarnings = assignments
        .filter(a => a.date === dateStr && a.status === 'completed')
        .reduce((s, a) => s + a.earned, 0)
      dailyEarnings.push({ date: dateStr, amount: dayEarnings })
    }

    return NextResponse.json({
      summary: {
        thisWeek: Math.round(thisWeekEarnings * 100) / 100,
        lastWeek: Math.round(lastWeekEarnings * 100) / 100,
        weeklyChange,
        thisWeekTrips: thisWeekTrips.length,
        totalTrips: assignments.filter(a => a.status === 'completed').length,
      },
      dailyEarnings,
      recentTrips: assignments.slice(0, 20),
    })
  } catch (err) {
    console.error('[Driver Earnings API]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
