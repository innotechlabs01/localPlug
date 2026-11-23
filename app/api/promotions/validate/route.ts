import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * Public API: validates a promo code and returns discount info.
 * Used by the booking flow to apply promotional discounts.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const hotelId = searchParams.get('hotel_id')

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    const db = getDb()

    let sql = 'SELECT p.*, h.name as hotel_name FROM promotions p JOIN hotels h ON p.hotel_id = h.id WHERE p.code = ? AND p.type = ?'
    const args: (string | number)[] = [code.toUpperCase(), 'promo_code']

    if (hotelId) {
      sql += ' AND p.hotel_id = ?'
      args.push(parseInt(hotelId))
    }

    const result = await db.execute({ sql, args })

    if (!result.rows.length) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code' }, { status: 404 })
    }

    const promo = result.rows[0] as any

    // Check if active
    if (!promo.is_active) {
      return NextResponse.json({ valid: false, error: 'Promotion is no longer active' }, { status: 400 })
    }

    // Check dates
    const now = new Date().toISOString()
    if (promo.starts_at && promo.starts_at > now) {
      return NextResponse.json({ valid: false, error: 'Promotion has not started yet' }, { status: 400 })
    }
    if (promo.ends_at && promo.ends_at < now) {
      return NextResponse.json({ valid: false, error: 'Promotion has expired' }, { status: 400 })
    }

    // Check usage limit
    if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json({ valid: false, error: 'Promotion usage limit reached' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      promotion: {
        id: promo.id,
        code: promo.code,
        discount_amount: Number(promo.discount_amount),
        hotel_id: promo.hotel_id,
        hotel_name: promo.hotel_name,
        type: promo.type,
      },
    })
  } catch (error) {
    console.error('[Promo Validate API] error:', error)
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 })
  }
}
