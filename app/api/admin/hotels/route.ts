import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { resolveHotelContext } from '@/lib/admin/hotel-auth'
import { clerkClient } from '@clerk/nextjs/server'
import { triggerManagerCreated } from '@/lib/n8n/client'

const ALLOWED_COLUMNS = [
  'name', 'slug', 'description', 'address', 'lat', 'lng',
  'phone', 'email', 'website', 'photos', 'stars', 'status', 'commission_rate',
]

export async function GET(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'view')
    if (authError) return authError

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    let sql = 'SELECT * FROM hotels WHERE 1=1'
    const args: (string | number)[] = []

    // Hotel managers see only their hotel
    if (ctx.hotelId) {
      sql += ' AND id = ?'
      args.push(ctx.hotelId)
    }

    if (search) {
      sql += ' AND (name LIKE ? OR address LIKE ? OR description LIKE ?)'
      const like = `%${search}%`
      args.push(like, like, like)
    }

    sql += ' ORDER BY name ASC'

    const result = await db.execute({ sql, args })
    const hotels = result.rows || []

    // Get room counts per hotel
    const counts = await db.execute(`
      SELECT hotel_id, COUNT(*) as room_count, COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms
      FROM rooms GROUP BY hotel_id
    `)
    const countMap: Record<number, { room_count: number; available_rooms: number }> = {}
    for (const row of counts.rows) {
      countMap[row.hotel_id as number] = {
        room_count: row.room_count as number,
        available_rooms: row.available_rooms as number,
      }
    }

    const hotelsWithCounts = hotels.map((h: any) => ({
      ...h,
      room_count: countMap[h.id as number]?.room_count || 0,
      available_rooms: countMap[h.id as number]?.available_rooms || 0,
    }))

    return NextResponse.json({ hotels: hotelsWithCounts })
  } catch (error) {
    console.error('[Hotels API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'create')
    if (authError) return authError

    const body = await req.json()
    const {
      name, slug, description, address, lat, lng, phone, email, website, photos, stars, status, commission_rate,
      manager_name, manager_email, manager_password,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
    }

    if (!manager_name || !manager_email || !manager_password) {
      return NextResponse.json({ error: 'Manager name, email, and password are required' }, { status: 400 })
    }

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const db = getDb()

    // Check slug uniqueness
    const existing = await db.execute({ sql: 'SELECT id FROM hotels WHERE slug = ?', args: [finalSlug] })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A hotel with this slug already exists' }, { status: 409 })
    }

    // Create hotel
    const hotelResult = await db.execute({
      sql: `INSERT INTO hotels (name, slug, description, address, lat, lng, phone, email, website, photos, stars, status, commission_rate, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        name, finalSlug, description || '', address || '',
        lat || null, lng || null, phone || '', email || '', website || '',
        photos || '[]', stars || 3, status || 'active', commission_rate ?? 0.10,
      ],
    })

    const hotelId = Number(hotelResult.lastInsertRowid)

    // Create Clerk user for hotel manager
    try {
      const client = await clerkClient()
      const nameParts = manager_name.trim().split(/\s+/)
      const firstName = nameParts[0] || manager_name
      const lastName = nameParts.slice(1).join(' ') || ''

      const clerkUser = await client.users.createUser({
        emailAddress: [manager_email],
        firstName,
        lastName,
        password: manager_password,
        publicMetadata: { role: 'hotel_manager' },
      })

      // Create user in local DB linked to Clerk and hotel
      await db.execute({
        sql: `INSERT INTO users (clerk_id, name, email, role_id, hotel_id, status, created_at)
              VALUES (?, ?, ?, 5, ?, 'active', datetime('now'))`,
        args: [clerkUser.id, manager_name, manager_email, hotelId],
      })

      // Send WhatsApp notification to manager via n8n (fire and forget)
      triggerManagerCreated({
        managerName: manager_name,
        managerEmail: manager_email,
        temporaryPassword: manager_password,
        hotelName: name,
        hotelSlug: finalSlug,
        managerPhone: phone || undefined,
      }).then(r => {
        if (!r.success) console.error('[Hotels API] Manager notification failed:', r.error)
      })

      return NextResponse.json({
        success: true,
        id: hotelId,
        slug: finalSlug,
        manager: { email: manager_email, temporaryPassword: manager_password },
      })
    } catch (clerkError: any) {
      console.error('[Hotels API] Clerk user creation failed:', clerkError)
      // Hotel was created but manager creation failed - still return success with warning
      return NextResponse.json({
        success: true,
        id: hotelId,
        slug: finalSlug,
        warning: 'Hotel created but manager account creation failed. You can assign a manager later.',
        error: clerkError?.errors?.[0]?.message || clerkError?.message || 'Unknown Clerk error',
      })
    }
  } catch (error) {
    console.error('[Hotels API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'update')
    if (authError) return authError

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })

    // Hotel managers can only update their hotel
    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error
    if (ctx.hotelId && ctx.hotelId !== Number(id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = getDb()
    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_COLUMNS)

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    await db.execute({
      sql: `UPDATE hotels SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Hotels API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update hotel' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'delete')
    if (authError) return authError

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 })

    const db = getDb()

    // Cascade delete handled by FK constraints on rooms, promotions, room_bookings
    await db.execute({ sql: 'DELETE FROM hotels WHERE id = ?', args: [parseInt(id)] })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Hotels API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete hotel' }, { status: 500 })
  }
}
