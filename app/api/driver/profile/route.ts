import { NextResponse } from 'next/server'
import { getDriverFromSession } from '@/lib/driver/auth'
import { getDb } from '@/lib/db'
import { getVehicleCategory } from '@/lib/payout'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ driver: result.driver })
  } catch (err) {
    console.error('[Driver Profile GET]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const result = await getDriverFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await req.json()
    const {
      name, phone, email, vehicle, plate, category,
      vehicle_category_id,
      languages, experience_level, photo_url, notes,
      license_number, license_expiry, bank_account,
      city, vip_compatible, emergency_contact, emergency_phone,
    } = body

    if (!name || !vehicle || !plate) {
      return NextResponse.json({ error: 'name, vehicle, plate required' }, { status: 400 })
    }

    const db = getDb()

    // If a vehicle category is selected, keep `category` (legacy dispatch filter)
    // in sync with its name so existing category-based dispatch still works.
    let effectiveCategory = category || 'standard'
    let effectiveCategoryId: number | null = null
    if (body.vehicle_category_id !== undefined && body.vehicle_category_id !== null && body.vehicle_category_id !== '') {
      const catId = Number(body.vehicle_category_id)
      const cat = Number.isFinite(catId) ? await getVehicleCategory(catId) : null
      if (cat) {
        effectiveCategoryId = cat.id
        effectiveCategory = cat.name
      } else {
        return NextResponse.json({ error: 'vehicle_category_id not found' }, { status: 400 })
      }
    } else if ((vehicle_category_id === null || vehicle_category_id === '')) {
      effectiveCategoryId = null
    }

    await db.execute({
      sql: `UPDATE drivers SET
        name = ?, phone = ?, email = ?, vehicle = ?, plate = ?, category = ?, vehicle_category_id = ?,
        languages = ?, experience_level = ?, photo_url = ?, notes = ?,
        license_number = ?, license_expiry = ?, bank_account = ?,
        city = ?, vip_compatible = ?, emergency_contact = ?, emergency_phone = ?,
        profile_complete = 1, updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        name, phone || null, email || null,
        vehicle, plate, effectiveCategory, effectiveCategoryId,
        languages || 'Spanish', experience_level || 'Standard', photo_url || null, notes || null,
        license_number || null, license_expiry || null, bank_account || null,
        city || null, vip_compatible ? 1 : 0, emergency_contact || null, emergency_phone || null,
        result.driver.id,
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Driver Profile PUT]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
