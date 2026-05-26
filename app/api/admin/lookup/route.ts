import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const tables = [
    'lookup_countries', 'lookup_languages', 'lookup_packages',
    'lookup_vehicle_categories', 'lookup_experience_levels', 'lookup_departments',
    'lookup_employee_statuses', 'lookup_order_statuses', 'lookup_dispatch_statuses',
    'lookup_payment_statuses', 'lookup_driver_statuses', 'lookup_document_statuses',
    'lookup_traveler_profiles', 'lookup_additional_trips', 'lookup_customer_statuses',
    'lookup_case_types', 'lookup_agent_statuses', 'lookup_vip_tiers',
  ]

  const result: Record<string, any[]> = {}
  for (const table of tables) {
    try {
      const r = await db.execute(`SELECT * FROM ${table} ORDER BY sort_order ASC`)
      result[table.replace('lookup_', '')] = r.rows
    } catch {
      result[table.replace('lookup_', '')] = []
    }
  }

  return NextResponse.json(result)
}
