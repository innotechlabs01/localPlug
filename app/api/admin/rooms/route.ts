import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { resolveHotelContext } from '@/lib/admin/hotel-auth'

const ALLOWED_COLUMNS = [
  'hotel_id', 'name', 'description', 'capacity',
  'price_per_night', 'amenities', 'photos', 'status',
]

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'view')
    if (authError) return authError

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const hotelId = searchParams.get('hotel_id')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    let sql = `SELECT r.*, h.name as hotel_name, h.commission_rate
               FROM rooms r
               JOIN hotels h ON r.hotel_id = h.id
               WHERE 1=1`
    const args: (string | number)[] = []

    // Hotel managers see only their hotel's rooms
    if (ctx.hotelId) {
      sql += ' AND r.hotel_id = ?'
      args.push(ctx.hotelId)
    } else if (hotelId) {
      sql += ' AND r.hotel_id = ?'
      args.push(parseInt(hotelId))
    }

    if (search) {
      sql += ' AND (r.name LIKE ? OR r.description LIKE ?)'
      const like = `%${search}%`
      args.push(like, like)
    }

    if (status) {
      sql += ' AND r.status = ?'
      args.push(status)
    }

    sql += ' ORDER BY r.hotel_id, r.name ASC'

    const result = await db.execute({ sql, args })
    const rooms = result.rows || []

    // Calculate display prices (price + commission)
    const roomsWithDisplay = rooms.map((r: any) => {
      const basePrice = Number(r.price_per_night) || 0
      const commissionRate = Number(r.commission_rate) || 0
      return {
        ...r,
        display_price: basePrice + (basePrice * commissionRate),
      }
    })

    return NextResponse.json({ rooms: roomsWithDisplay })
  } catch (error) {
    console.error('[Rooms API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'create')
    if (authError) return authError

    const body = await req.json()
    const { hotel_id, name, description, capacity, price_per_night, amenities, photos, status } = body

    if (!hotel_id || !name || !price_per_night) {
      return NextResponse.json({ error: 'hotel_id, name, and price_per_night are required' }, { status: 400 })
    }

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error
    if (ctx.hotelId && ctx.hotelId !== Number(hotel_id)) {
      return NextResponse.json({ error: 'Forbidden: can only add rooms to your hotel' }, { status: 403 })
    }

    const db = getDb()

    // Verify hotel exists
    const hotel = await db.execute({ sql: 'SELECT id FROM hotels WHERE id = ?', args: [hotel_id] })
    if (!hotel.rows.length) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const result = await db.execute({
      sql: `INSERT INTO rooms (hotel_id, name, description, capacity, price_per_night, amenities, photos, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        hotel_id, name, description || '', capacity || 1,
        price_per_night, amenities || '[]', photos || '[]', status || 'available',
      ],
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Rooms API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()

    // Verify room exists and belongs to user's hotel (if hotel manager)
    if (ctx.hotelId) {
      const room = await db.execute({ sql: 'SELECT hotel_id FROM rooms WHERE id = ?', args: [id] })
      if (!room.rows.length) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }
      if (room.rows[0].hotel_id !== ctx.hotelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_COLUMNS)

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    await db.execute({
      sql: `UPDATE rooms SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Rooms API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()

    if (ctx.hotelId) {
      const room = await db.execute({ sql: 'SELECT hotel_id FROM rooms WHERE id = ?', args: [parseInt(id)] })
      if (!room.rows.length || room.rows[0].hotel_id !== ctx.hotelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await db.execute({ sql: 'DELETE FROM rooms WHERE id = ?', args: [parseInt(id)] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Rooms API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
