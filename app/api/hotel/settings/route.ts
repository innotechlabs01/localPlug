import { NextResponse } from 'next/server'
import { getHotelFromSession } from '@/lib/hotel/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const db = getDb()
    const hotelId = result.hotel.id

    // Get hotel settings from a JSON field or separate table
    // For now, use the hotel's existing fields + custom settings
    const settingsResult = await db.execute({
      sql: `SELECT * FROM hotels WHERE id = ?`,
      args: [hotelId],
    })

    const hotel = settingsResult.rows[0] as any

    return NextResponse.json({
      settings: {
        name: hotel.name || '',
        description: hotel.description || '',
        address: hotel.address || '',
        phone: hotel.phone || '',
        email: hotel.email || '',
        website: hotel.website || '',
        bank_account: hotel.bank_account || '',
        permits: hotel.permits || '',
        // Custom theme colors (stored in a JSON column or separate settings)
        theme: {
          primary: '#c8a962',
          background: '#0a0a0f',
          surface: '#1a1a2e',
          text: '#ffffff',
        },
      },
    })
  } catch (err) {
    console.error('[Hotel Settings API]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const result = await getHotelFromSession()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const db = getDb()
    const hotelId = result.hotel.id
    const body = await req.json()

    const { name, description, address, phone, email, website, bank_account, permits, theme } = body

    // Update hotel profile fields
    const setClauses: string[] = []
    const args: any[] = []

    if (name !== undefined) { setClauses.push('name = ?'); args.push(name) }
    if (description !== undefined) { setClauses.push('description = ?'); args.push(description) }
    if (address !== undefined) { setClauses.push('address = ?'); args.push(address) }
    if (phone !== undefined) { setClauses.push('phone = ?'); args.push(phone) }
    if (email !== undefined) { setClauses.push('email = ?'); args.push(email) }
    if (website !== undefined) { setClauses.push('website = ?'); args.push(website) }
    if (bank_account !== undefined) { setClauses.push('bank_account = ?'); args.push(bank_account) }
    if (permits !== undefined) { setClauses.push('permits = ?'); args.push(permits) }

    if (setClauses.length > 0) {
      setClauses.push("updated_at = datetime('now')")
      args.push(hotelId)
      await db.execute({
        sql: `UPDATE hotels SET ${setClauses.join(', ')} WHERE id = ?`,
        args,
      })
    }

    // Save theme to hotel_settings table or JSON field
    if (theme) {
      try {
        await db.execute({
          sql: `CREATE TABLE IF NOT EXISTS hotel_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, hotel_id INTEGER UNIQUE, theme_json TEXT, updated_at TEXT)`,
          args: [],
        })
        await db.execute({
          sql: `INSERT OR REPLACE INTO hotel_settings (hotel_id, theme_json, updated_at) VALUES (?, ?, datetime('now'))`,
          args: [hotelId, JSON.stringify(theme)],
        })
      } catch { /* table might not exist yet, non-critical */ }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Hotel Settings API] PUT', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
