import { NextResponse } from 'next/server'
import { getDriverFromSession } from '@/lib/driver/auth'
import { getDriverDashboardMetrics } from '@/lib/driver/dashboard'

export async function GET() {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const metrics = await getDriverDashboardMetrics(result.driver.id)

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('[Driver Dashboard API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 })
  }
}
