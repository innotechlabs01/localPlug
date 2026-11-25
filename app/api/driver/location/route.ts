import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'

async function ensureDriverLocationsTable() {
  const db = getDb()
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS driver_locations (
      driver_id INTEGER PRIMARY KEY,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      heading REAL,
      speed REAL,
      accuracy REAL,
      order_id INTEGER,
      gps_consent INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    args: [],
  })
}

async function resolveDriverId(clerkId: string): Promise<number | null> {
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT id FROM drivers WHERE clerk_user_id = ? LIMIT 1',
    args: [clerkId],
  })
  if (res.rows.length > 0) return Number(res.rows[0].id)

  // Fallback by user email
  const uRes = await db.execute({
    sql: 'SELECT email FROM users WHERE clerk_id = ? LIMIT 1',
    args: [clerkId],
  })
  const email = uRes.rows[0]?.email ? String(uRes.rows[0].email).trim().toLowerCase() : ''
  if (email) {
    const byEmail = await db.execute({
      sql: 'SELECT id FROM drivers WHERE LOWER(email) = ? LIMIT 1',
      args: [email],
    })
    if (byEmail.rows.length > 0) return Number(byEmail.rows[0].id)
  }
  return null
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const driverId = await resolveDriverId(userId)
    if (!driverId) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 })
    }

    await ensureDriverLocationsTable()
    const db = getDb()
    await db.execute({
      sql: `INSERT INTO driver_locations (driver_id, lat, lng, heading, speed, accuracy, order_id, gps_consent, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
            ON CONFLICT(driver_id) DO UPDATE SET
              lat = excluded.lat,
              lng = excluded.lng,
              heading = excluded.heading,
              speed = excluded.speed,
              accuracy = excluded.accuracy,
              order_id = COALESCE(excluded.order_id, driver_locations.order_id),
              gps_consent = 1,
              updated_at = datetime('now')`,
      args: [
        driverId,
        lat,
        lng,
        body.heading != null ? Number(body.heading) : null,
        body.speed != null ? Number(body.speed) : null,
        body.accuracy != null ? Number(body.accuracy) : null,
        body.orderId != null ? Number(body.orderId) : null,
      ],
    })

    return NextResponse.json({ success: true, driverId, lat, lng })
  } catch (err) {
    console.error('[Driver Location] POST error:', err)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const driverId = await resolveDriverId(userId)
    if (!driverId) {
      return NextResponse.json({ success: true })
    }
    await ensureDriverLocationsTable()
    const db = getDb()
    await db.execute({
      sql: `UPDATE driver_locations SET gps_consent = 0, updated_at = datetime('now') WHERE driver_id = ?`,
      args: [driverId],
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Driver Location] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to stop location sharing' }, { status: 500 })
  }
}
