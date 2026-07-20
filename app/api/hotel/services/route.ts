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

    const db = getDb()
    const svcResult = await db.execute({
      sql: `SELECT * FROM hotel_services WHERE hotel_id = ? ORDER BY created_at DESC`,
      args: [result.hotel.id],
    })

    return NextResponse.json({ services: svcResult.rows })
  } catch (err) {
    console.error('[Hotel Services GET]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const body = await req.json()
    const { name, description, base_price, commission_applies } = body

    if (!name || base_price === undefined) {
      return NextResponse.json({ error: 'name and base_price required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `INSERT INTO hotel_services (hotel_id, name, description, base_price, commission_applies, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [result.hotel.id, name, description || null, base_price, commission_applies !== false ? 1 : 0],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Services POST]', err)
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
    const { id, name, description, base_price, commission_applies, active } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const db = getDb()
    const existing = await db.execute({
      sql: `SELECT id FROM hotel_services WHERE id = ? AND hotel_id = ?`,
      args: [id, result.hotel.id],
    })
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    await db.execute({
      sql: `UPDATE hotel_services SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        base_price = COALESCE(?, base_price),
        commission_applies = COALESCE(?, commission_applies),
        active = COALESCE(?, active),
        updated_at = datetime('now')
        WHERE id = ? AND hotel_id = ?`,
      args: [
        name || null, description !== undefined ? description : null,
        base_price !== undefined ? base_price : null,
        commission_applies !== undefined ? (commission_applies ? 1 : 0) : null,
        active !== undefined ? (active ? 1 : 0) : null,
        id, result.hotel.id,
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Services PUT]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { searchParams } = new URL(req.url)
    const svcId = searchParams.get('id')
    if (!svcId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `DELETE FROM hotel_services WHERE id = ? AND hotel_id = ?`,
      args: [Number(svcId), result.hotel.id],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Services DELETE]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
