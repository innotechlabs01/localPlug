import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

async function ensurePanicTable() {
  const db = getDb()
  await db.execute({
    sql: `CREATE TABLE IF NOT EXISTS driver_panic_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      order_id INTEGER,
      lat REAL,
      lng REAL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    )`,
    args: [],
  })
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const drvRes = await db.execute({
      sql: 'SELECT id, name FROM drivers WHERE clerk_user_id = ? LIMIT 1',
      args: [userId],
    })
    if (drvRes.rows.length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }
    const driverId = Number(drvRes.rows[0].id)

    await ensurePanicTable()
    const body = await request.json().catch(() => ({}))
    const orderId = body.orderId != null ? Number(body.orderId) : null
    const lat = body.lat != null ? Number(body.lat) : null
    const lng = body.lng != null ? Number(body.lng) : null
    const note = String(body.note || 'Botón de pánico activado durante el viaje').trim()

    const res = await db.execute({
      sql: `INSERT INTO driver_panic_alerts (driver_id, order_id, lat, lng, note, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))`,
      args: [driverId, orderId, lat, lng, note],
    })

    // Also update driver_locations if lat/lng provided so admin map jumps straight to them
    if (lat != null && lng != null) {
      await db.execute({
        sql: `INSERT INTO driver_locations (driver_id, lat, lng, order_id, gps_consent, updated_at)
              VALUES (?, ?, ?, ?, 1, datetime('now'))
              ON CONFLICT(driver_id) DO UPDATE SET lat = excluded.lat, lng = excluded.lng, updated_at = datetime('now')`,
        args: [driverId, lat, lng, orderId],
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, alertId: Number(res.lastInsertRowid) }, { status: 201 })
  } catch (err) {
    console.error('[Driver Panic] POST error:', err)
    return NextResponse.json({ error: 'Failed to trigger SOS alert' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const authError = await requirePermission('dispatch', 'update')
    if (authError) return authError

    await ensurePanicTable()
    const body = await request.json()
    const alertId = Number(body.alertId)
    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `UPDATE driver_panic_alerts SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?`,
      args: [alertId],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Driver Panic] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to resolve SOS alert' }, { status: 500 })
  }
}
