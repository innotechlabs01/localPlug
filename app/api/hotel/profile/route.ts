import { NextResponse } from 'next/server'
import { getHotelFromSession } from '@/lib/hotel/auth'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ hotel: result.hotel, user: result.user })
  } catch (err) {
    console.error('[Hotel Profile GET]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await req.json()
    const {
      name, description, address, phone, email, website,
      stars, bank_account, permits,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }

    const db = getDb()
    const profileComplete = name && address ? 1 : 0

    await db.execute({
      sql: `UPDATE hotels SET
        name = ?, description = ?, address = ?, phone = ?, email = ?, website = ?,
        stars = ?, bank_account = ?, permits = ?,
        profile_complete = ?, updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        name, description || null, address || null, phone || null, email || null, website || null,
        stars || 3, bank_account || null, permits || null,
        profileComplete, result.hotel.id,
      ],
    })

    // Also update user name
    await db.execute({
      sql: `UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [name, result.user.id],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Profile PUT]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
