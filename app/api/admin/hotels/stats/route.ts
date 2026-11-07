import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { resolveHotelContext } from '@/lib/admin/hotel-auth'

/**
 * Returns hotel dashboard stats: bookings, revenue, occupancy, recent activity.
 * Admin: pass ?hotel_id=X to get stats for a specific hotel.
 * Hotel manager: automatically scoped to their hotel.
 */
export async function GET(req: Request) {
  try {
    const authError = await requirePermission('hotels', 'view')
    if (authError) return authError

    const ctx = await resolveHotelContext()
    if (ctx.error) return ctx.error

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const hotelId = ctx.hotelId || parseInt(searchParams.get('hotel_id') || '0')

    if (!hotelId) {
      return NextResponse.json({ error: 'hotel_id required' }, { status: 400 })
    }

    // Verify hotel exists
    const hotel = await db.execute({
      sql: 'SELECT * FROM hotels WHERE id = ?',
      args: [hotelId],
    })
    if (!hotel.rows.length) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const h = hotel.rows[0] as any

    // Room stats
    const roomStats = await db.execute({
      sql: `SELECT
              COUNT(*) as total_rooms,
              COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
              COUNT(CASE WHEN status = 'unavailable' THEN 1 END) as unavailable_rooms,
              COALESCE(AVG(price_per_night), 0) as avg_price,
              COALESCE(MIN(price_per_night), 0) as min_price,
              COALESCE(MAX(price_per_night), 0) as max_price
            FROM rooms WHERE hotel_id = ?`,
      args: [hotelId],
    })
    const rooms = roomStats.rows[0] as any

    // Booking stats
    const bookingStats = await db.execute({
      sql: `SELECT
              COUNT(*) as total_bookings,
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COALESCE(SUM(discount_applied), 0) as total_discounts,
              COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
              COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as checked_in,
              COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as checked_out,
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
            FROM room_bookings WHERE hotel_id = ?`,
      args: [hotelId],
    })
    const bookings = bookingStats.rows[0] as any

    // Today's activity
    const todayActivity = await db.execute({
      sql: `SELECT
              COUNT(CASE WHEN check_in <= date('now') AND status IN ('confirmed','checked_in') THEN 1 END) as today_arrivals,
              COUNT(CASE WHEN check_in < date('now') AND status = 'checked_in' THEN 1 END) as currently_staying,
              COUNT(CASE WHEN check_in = date('now') THEN 1 END) as checking_in_today,
              COUNT(CASE WHEN date(check_in, '+' || nights || ' days') = date('now') THEN 1 END) as checking_out_today
            FROM room_bookings WHERE hotel_id = ?`,
      args: [hotelId],
    })
    const today = todayActivity.rows[0] as any

    // Recent bookings (last 10)
    const recentResult = await db.execute({
      sql: `SELECT rb.*, o.order_number, o.customer_name, o.customer_email, o.customer_phone
            FROM room_bookings rb
            LEFT JOIN orders o ON rb.order_id = o.id
            WHERE rb.hotel_id = ?
            ORDER BY rb.created_at DESC LIMIT 10`,
      args: [hotelId],
    })
    const recent = recentResult.rows || []

    // Promotions stats
    const promoStats = await db.execute({
      sql: `SELECT COUNT(*) as active_promos, COALESCE(SUM(usage_count), 0) as total_uses
            FROM promotions WHERE hotel_id = ? AND is_active = 1`,
      args: [hotelId],
    })
    const promos = promoStats.rows[0] as any

    // Revenue: hotel earns base price, platform earns commission
    const commissionRate = Number(h.commission_rate) || 0
    const totalRevenue = Number(bookings.total_revenue) || 0
    const platformRevenue = totalRevenue > 0 ? totalRevenue * commissionRate / (1 + commissionRate) : 0
    const hotelRevenue = totalRevenue - platformRevenue

    return NextResponse.json({
      hotel: {
        id: h.id,
        name: h.name,
        slug: h.slug,
        stars: h.stars,
        status: h.status,
        commission_rate: commissionRate,
      },
      rooms,
      bookings: {
        ...bookings,
        total_revenue: totalRevenue,
        hotel_revenue: Math.round(hotelRevenue * 100) / 100,
        platform_revenue: Math.round(platformRevenue * 100) / 100,
      },
      today,
      promos,
      recentBookings: recent,
    })
  } catch (error) {
    console.error('[Hotel Stats API] error:', error)
    return NextResponse.json({ error: 'Failed to fetch hotel stats' }, { status: 500 })
  }
}
