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
      languages, experience_level, photo_url, notes,
      license_number, license_expiry, bank_account,
      city, vip_compatible, emergency_contact, emergency_phone,
    } = body

    if (!name || !vehicle || !plate) {
      return NextResponse.json({ error: 'name, vehicle, plate required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `UPDATE drivers SET
        name = ?, phone = ?, email = ?, vehicle = ?, plate = ?, category = ?,
        languages = ?, experience_level = ?, photo_url = ?, notes = ?,
        license_number = ?, license_expiry = ?, bank_account = ?,
        city = ?, vip_compatible = ?, emergency_contact = ?, emergency_phone = ?,
        profile_complete = 1, updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        name, phone || null, email || null,
        vehicle, plate, category || 'standard',
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
