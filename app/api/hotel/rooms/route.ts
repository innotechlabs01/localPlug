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
    const roomsResult = await db.execute({
      sql: `SELECT * FROM rooms WHERE hotel_id = ? ORDER BY created_at DESC`,
      args: [result.hotel.id],
    })

    return NextResponse.json({ rooms: roomsResult.rows })
  } catch (err) {
    console.error('[Hotel Rooms GET]', err)
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
    const { name, description, capacity, price_per_night, amenities, beds, breakfast_included } = body

    if (!name || !price_per_night) {
      return NextResponse.json({ error: 'name and price_per_night required' }, { status: 400 })
    }

    const db = getDb()
    const amenitiesJson = amenities ? JSON.stringify(amenities) : '[]'

    await db.execute({
      sql: `INSERT INTO rooms (hotel_id, name, description, capacity, price_per_night, amenities, beds, breakfast_included, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', datetime('now'), datetime('now'))`,
      args: [
        result.hotel.id,
        name,
        description || null,
        capacity || 1,
        price_per_night,
        amenitiesJson,
        beds || capacity || 1,
        breakfast_included ? 1 : 0,
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Rooms POST]', err)
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
    const { id, name, description, capacity, price_per_night, amenities, beds, breakfast_included, status } = body

    if (!id || !name || !price_per_night) {
      return NextResponse.json({ error: 'id, name, price_per_night required' }, { status: 400 })
    }

    const db = getDb()

    // Verify room belongs to this hotel
    const existing = await db.execute({
      sql: `SELECT id FROM rooms WHERE id = ? AND hotel_id = ?`,
      args: [id, result.hotel.id],
    })
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const amenitiesJson = amenities ? JSON.stringify(amenities) : undefined

    await db.execute({
      sql: `UPDATE rooms SET
        name = ?, description = ?, capacity = ?, price_per_night = ?,
        amenities = ?, beds = ?, breakfast_included = ?, status = ?,
        updated_at = datetime('now')
        WHERE id = ? AND hotel_id = ?`,
      args: [
        name,
        description || null,
        capacity || 1,
        price_per_night,
        amenitiesJson || undefined,
        beds || capacity || 1,
        breakfast_included ? 1 : 0,
        status || 'available',
        id,
        result.hotel.id,
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Rooms PUT]', err)
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
    const roomId = searchParams.get('id')
    if (!roomId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `DELETE FROM rooms WHERE id = ? AND hotel_id = ?`,
      args: [Number(roomId), result.hotel.id],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Rooms DELETE]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
