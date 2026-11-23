import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { resolveHotelContext } from '@/lib/admin/hotel-auth'

const ALLOWED_COLUMNS = [
  'hotel_id', 'type', 'code', 'discount_amount', 'is_active',
  'usage_limit', 'starts_at', 'ends_at',
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

    let sql = `SELECT p.*, h.name as hotel_name
               FROM promotions p
               JOIN hotels h ON p.hotel_id = h.id
               WHERE 1=1`
    const args: (string | number)[] = []

    if (ctx.hotelId) {
      sql += ' AND p.hotel_id = ?'
      args.push(ctx.hotelId)
    } else if (hotelId) {
      sql += ' AND p.hotel_id = ?'
      args.push(parseInt(hotelId))
    }

    sql += ' ORDER BY p.created_at DESC'

    const result = await db.execute({ sql, args })
    const promotions = result.rows || []

    return NextResponse.json({ promotions })
  } catch (error) {
    console.error('[Promotions API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'create')
    if (authError) return authError

    const body = await req.json()
    const { hotel_id, type, code, discount_amount, is_active, usage_limit, starts_at, ends_at } = body

    if (!hotel_id || !type || !discount_amount) {
      return NextResponse.json({ error: 'hotel_id, type, and discount_amount are required' }, { status: 400 })
    }

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error
    if (ctx.hotelId && ctx.hotelId !== Number(hotel_id)) {
      return NextResponse.json({ error: 'Forbidden: can only create promotions for your hotel' }, { status: 403 })
    }

    // Validate promo code uniqueness
    if (type === 'promo_code' && code) {
      const db = getDb()
      const existing = await db.execute({ sql: 'SELECT id FROM promotions WHERE code = ?', args: [code] })
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'A promotion with this code already exists' }, { status: 409 })
      }
    }

    const db = getDb()

    // Verify hotel exists
    const hotel = await db.execute({ sql: 'SELECT id FROM hotels WHERE id = ?', args: [hotel_id] })
    if (!hotel.rows.length) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const result = await db.execute({
      sql: `INSERT INTO promotions (hotel_id, type, code, discount_amount, is_active, usage_limit, starts_at, ends_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        hotel_id, type, code || null, discount_amount,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        usage_limit || null, starts_at || null, ends_at || null,
      ],
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Promotions API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 })

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()

    if (ctx.hotelId) {
      const promo = await db.execute({ sql: 'SELECT hotel_id FROM promotions WHERE id = ?', args: [id] })
      if (!promo.rows.length || promo.rows[0].hotel_id !== ctx.hotelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Convert is_active boolean to integer
    if ('is_active' in updates) {
      updates.is_active = updates.is_active ? 1 : 0
    }

    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_COLUMNS)

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    await db.execute({
      sql: `UPDATE promotions SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Promotions API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 })

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()

    if (ctx.hotelId) {
      const promo = await db.execute({ sql: 'SELECT hotel_id FROM promotions WHERE id = ?', args: [parseInt(id)] })
      if (!promo.rows.length || promo.rows[0].hotel_id !== ctx.hotelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await db.execute({ sql: 'DELETE FROM promotions WHERE id = ?', args: [parseInt(id)] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Promotions API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 })
  }
}
