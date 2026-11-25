import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

// Reference landmarks in Medellín / Rionegro
const MDE_AIRPORT = { lat: 6.1645, lng: -75.4231, name: 'Aeropuerto JMC (MDE)' }
const EL_POBLADO = { lat: 6.2088, lng: -75.5670, name: 'El Poblado, Medellín' }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET() {
  try {
    const authError = await requirePermission('dispatch', 'view')
    if (authError) return authError

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

    const result = await db.execute({
      sql: `SELECT
              d.id, d.name, d.phone, d.vehicle, d.plate, d.category, d.status,
              dl.lat, dl.lng, dl.heading, dl.speed, dl.accuracy, dl.gps_consent, dl.updated_at as gps_updated_at,
              o.id as active_order_id, o.booking_reference, o.customer_name, o.flight_number,
              o.arrival_date, o.arrival_time, o.destination_address, o.dispatch_status, o.status as order_status,
              pa.id as panic_alert_id, pa.note as panic_note, pa.created_at as panic_created_at
            FROM drivers d
            LEFT JOIN driver_locations dl ON dl.driver_id = d.id AND dl.gps_consent = 1
            LEFT JOIN orders o ON o.assigned_to = d.id AND o.dispatch_status IN ('assigned', 'en_route', 'picked_up')
            LEFT JOIN driver_panic_alerts pa ON pa.driver_id = d.id AND pa.status = 'active'
            WHERE d.status IN ('available', 'active', 'on_route', 'busy')
            ORDER BY (pa.id IS NOT NULL) DESC, dl.updated_at DESC, d.name ASC`,
      args: [],
    })

    const drivers = (result.rows as any[]).map(row => {
      const hasGps = row.lat != null && row.lng != null
      const target = row.dispatch_status === 'picked_up' ? EL_POBLADO : MDE_AIRPORT
      let distanceKm: number | null = null
      let etaMinutes: number | null = null

      if (hasGps) {
        // Road factor ~1.35x straight-line distance in Medellín mountain roads; avg speed 35 km/h
        const straightKm = haversineKm(Number(row.lat), Number(row.lng), target.lat, target.lng)
        distanceKm = Math.round(straightKm * 1.35 * 10) / 10
        const avgSpeedKmh = row.speed && Number(row.speed) > 3 ? Math.min(80, Number(row.speed) * 3.6) : 35
        etaMinutes = Math.max(2, Math.round((distanceKm / avgSpeedKmh) * 60))
      }

      return {
        ...row,
        hasGps,
        targetName: target.name,
        targetLat: target.lat,
        targetLng: target.lng,
        distanceKm,
        etaMinutes,
      }
    })

    return NextResponse.json({
      success: true,
      drivers,
      landmarks: { airport: MDE_AIRPORT, city: EL_POBLADO },
    })
  } catch (err) {
    console.error('[Admin Maps Live] GET error:', err)
    return NextResponse.json({ error: 'Failed to load live map data' }, { status: 500 })
  }
}
