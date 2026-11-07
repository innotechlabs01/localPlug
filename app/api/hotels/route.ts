import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * Public API: list available hotels with rooms for the booking flow.
 * No authentication required - used by the "I need suggestions" section.
 */
export async function GET(req: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    // Get active hotels
    let hotelSql = `SELECT * FROM hotels WHERE status = 'active'`
    const hotelArgs: (string | number)[] = []

    if (search) {
      hotelSql += ` AND (name LIKE ? OR address LIKE ? OR description LIKE ?)`
      const like = `%${search}%`
      hotelArgs.push(like, like, like)
    }

    hotelSql += ' ORDER BY stars DESC, name ASC'

    const hotelsResult = await db.execute({ sql: hotelSql, args: hotelArgs })
    const hotels = hotelsResult.rows || []

    // Get available rooms for each hotel (exclude rooms with overlapping bookings)
    const checkIn = searchParams.get('checkIn') || searchParams.get('arrivalDate') || null
    const checkOut = searchParams.get('checkOut') || searchParams.get('returnDate') || null

    const hotelsWithRooms = await Promise.all(
      hotels.map(async (hotel: any) => {
        let roomsResult
        if (checkIn && checkOut) {
          try {
            roomsResult = await db.execute({
              sql: `SELECT * FROM rooms WHERE hotel_id = ? AND status != 'maintenance'
                    AND NOT EXISTS (
                      SELECT 1 FROM room_bookings rb
                      WHERE rb.room_id = rooms.id AND rb.status IN ('confirmed', 'checked_in')
                      AND rb.check_in < ? AND rb.check_out > ?
                    ) ORDER BY price_per_night ASC`,
              args: [hotel.id, checkOut, checkIn],
            })
          } catch {
            roomsResult = await db.execute({
              sql: `SELECT * FROM rooms WHERE hotel_id = ? AND status = 'available' ORDER BY price_per_night ASC`,
              args: [hotel.id],
            })
          }
        } else {
          roomsResult = await db.execute({
            sql: `SELECT * FROM rooms WHERE hotel_id = ? AND status = 'available' ORDER BY price_per_night ASC`,
            args: [hotel.id],
          })
        }
        const commissionRate = Number(hotel.commission_rate) || 0

        const rooms = (roomsResult.rows || []).map((room: any) => {
          const basePrice = Number(room.price_per_night) || 0
          return {
            ...room,
            display_price: Math.round((basePrice + (basePrice * commissionRate)) * 100) / 100,
          }
        })

        return {
          ...hotel,
          rooms,
        }
      })
    )

    return NextResponse.json({ hotels: hotelsWithRooms })
  } catch (error) {
    console.error('[Public Hotels API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
  }
}
