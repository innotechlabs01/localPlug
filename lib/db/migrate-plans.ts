import { getDb } from '@/lib/db'

let _packagesMigrated = false
let _legacyMigrated = false
let _tripsMigrated = false

// ─── New schema: packages, tours, package_features ───

interface SeedTour {
  name: string
  description: string
  price_per_person_usd: number
  vehicle_type: string
  duration_hours: number
}

interface SeedPackage {
  name: string
  slug: string
  description: string
  base_price_usd: number
  includes_pickup: boolean
  includes_sim: boolean
  includes_accompaniment: boolean
  accompaniment_hours: number
  accompaniment_type: string | null
  includes_round_trip: boolean
  includes_concierge: boolean
  service_fee_flat: number
  is_popular: boolean
  sort_order: number
  features: string[]
  tours: SeedTour[]
}

const SEED_PACKAGES: SeedPackage[] = [
  {
    name: 'Smooth Landing',
    slug: 'smooth-landing',
    description: 'Perfect for the independent traveler who just wants to arrive safe',
    base_price_usd: 89,
    includes_pickup: true,
    includes_sim: true,
    includes_accompaniment: false,
    accompaniment_hours: 0,
    accompaniment_type: null,
    includes_round_trip: false,
    includes_concierge: false,
    service_fee_flat: 0,
    is_popular: false,
    sort_order: 1,
    features: [
      'VIP Airport Pickup with sign & flight monitoring',
      'Premium SUV/Camioneta transfer',
      'Túnel de Oriente toll covered',
      'Pre-loaded Metro Cívica Card + premium water',
      'SIM/eSIM with high-speed data plan',
    ],
    tours: [],
  },
  {
    name: 'First 24',
    slug: 'first-24',
    description: 'Skip the gringo taxes and master the neighborhood instantly',
    base_price_usd: 159,
    includes_pickup: true,
    includes_sim: true,
    includes_accompaniment: true,
    accompaniment_hours: 2,
    accompaniment_type: 'bilingual_fixer',
    includes_round_trip: false,
    includes_concierge: false,
    service_fee_flat: 30,
    is_popular: true,
    sort_order: 2,
    features: [
      'Everything in Smooth Landing',
      '2-hour bilingual Local Fixer at your lobby',
      'VIP Check-in & neighborhood orientation tour',
      'Best ATMs, safe stores & hidden gems',
      'Rappi/delivery apps local optimization',
    ],
    tours: [],
  },
  {
    name: 'Full Insider',
    slug: 'full-insider',
    description: 'Ultimate peace of mind. Zero logistics stress',
    base_price_usd: 269,
    includes_pickup: true,
    includes_sim: true,
    includes_accompaniment: false,
    accompaniment_hours: 0,
    accompaniment_type: null,
    includes_round_trip: true,
    includes_concierge: true,
    service_fee_flat: 0,
    is_popular: false,
    sort_order: 3,
    features: [
      'Everything in First 24',
      'Round-trip airport transfer guarantee',
      '24/7 AI WhatsApp Concierge + translation',
      '24/7 human fixer safety net for emergencies',
      'Airbnb accommodation validation before landing',
    ],
    tours: [
      { name: 'Guatapé Day Trip', description: 'Pueblo de colores y subida a la Piedra del Penol', price_per_person_usd: 149, vehicle_type: 'suv', duration_hours: 8 },
      { name: 'Coffee Farm Experience', description: 'Finca cafetera y experiencia barista', price_per_person_usd: 119, vehicle_type: 'suv', duration_hours: 6 },
      { name: 'Santa Fe de Antioquia', description: 'Pueblo colonial patrimonio historico', price_per_person_usd: 89, vehicle_type: 'suv', duration_hours: 10 },
      { name: 'Comuna 13 Graffiti Tour', description: 'Recorrido por el arte urbano de Comuna 13', price_per_person_usd: 89, vehicle_type: 'suv', duration_hours: 4 },
      { name: 'Paragliding in San Felix', description: 'Vuelo en parapente sobre el valle de San Felix', price_per_person_usd: 79, vehicle_type: 'suv', duration_hours: 3 },
    ],
  },
]

export async function ensurePackagesSchema(): Promise<void> {
  if (_packagesMigrated) return

  const db = getDb()

  // Check if packages table exists
  const packagesCheck = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='packages'`)
  if (packagesCheck.rows.length > 0) {
    _packagesMigrated = true
    return
  }

  console.log('[Packages Schema] Running migration...')

  // Create packages table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      base_price_usd REAL NOT NULL DEFAULT 0,
      includes_pickup INTEGER DEFAULT 1,
      includes_sim INTEGER DEFAULT 0,
      includes_accompaniment INTEGER DEFAULT 0,
      accompaniment_hours REAL DEFAULT 0,
      accompaniment_type TEXT,
      includes_round_trip INTEGER DEFAULT 0,
      includes_concierge INTEGER DEFAULT 0,
      service_fee_flat REAL DEFAULT 0,
      is_popular INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Create tours table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price_per_person_usd REAL NOT NULL DEFAULT 0,
      vehicle_type TEXT NOT NULL DEFAULT 'suv',
      duration_hours REAL DEFAULT 8,
      max_people INTEGER DEFAULT 10,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Create package_features table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS package_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `)

  // Create room_bookings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS room_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      hotel_id INTEGER NOT NULL REFERENCES hotels(id),
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      nights INTEGER NOT NULL DEFAULT 1,
      price_per_night REAL NOT NULL,
      total_amount REAL NOT NULL,
      guest_name TEXT,
      guest_email TEXT,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Seed packages
  for (const pkg of SEED_PACKAGES) {
    const result = await db.execute({
      sql: `INSERT INTO packages (slug, name, description, base_price_usd,
        includes_pickup, includes_sim, includes_accompaniment, accompaniment_hours, accompaniment_type,
        includes_round_trip, includes_concierge, service_fee_flat, is_popular, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        pkg.slug, pkg.name, pkg.description, pkg.base_price_usd,
        pkg.includes_pickup ? 1 : 0, pkg.includes_sim ? 1 : 0,
        pkg.includes_accompaniment ? 1 : 0, pkg.accompaniment_hours, pkg.accompaniment_type,
        pkg.includes_round_trip ? 1 : 0, pkg.includes_concierge ? 1 : 0,
        pkg.service_fee_flat, pkg.is_popular ? 1 : 0, pkg.sort_order,
      ],
    })
    const packageId = Number(result.lastInsertRowid)

    for (let i = 0; i < pkg.features.length; i++) {
      await db.execute({
        sql: 'INSERT INTO package_features (package_id, text, sort_order) VALUES (?, ?, ?)',
        args: [packageId, pkg.features[i], i + 1],
      })
    }

    for (let i = 0; i < pkg.tours.length; i++) {
      const tour = pkg.tours[i]
      await db.execute({
        sql: 'INSERT INTO tours (package_id, name, description, price_per_person_usd, vehicle_type, duration_hours, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [packageId, tour.name, tour.description || '', tour.price_per_person_usd, tour.vehicle_type, tour.duration_hours, i + 1],
      })
    }
  }

  // Add rooms columns if they don't exist
  try { await db.execute(`ALTER TABLE rooms ADD COLUMN available_from TEXT`) } catch { /* already exists */ }
  try { await db.execute(`ALTER TABLE rooms ADD COLUMN current_order_id INTEGER`) } catch { /* already exists */ }

  // Add room_bookings.check_out if missing (existing table uses check_in + nights)
  try { await db.execute(`ALTER TABLE room_bookings ADD COLUMN check_out TEXT`) } catch { /* already exists */ }

  // Add orders columns if they don't exist
  try { await db.execute(`ALTER TABLE orders ADD COLUMN tour_subtotal_usd REAL DEFAULT 0`) } catch { /* already exists */ }
  try { await db.execute(`ALTER TABLE orders ADD COLUMN service_fee_usd REAL DEFAULT 0`) } catch { /* already exists */ }
  try { await db.execute(`ALTER TABLE orders ADD COLUMN tax_amount_usd REAL DEFAULT 0`) } catch { /* already exists */ }
  try { await db.execute(`ALTER TABLE orders ADD COLUMN grand_total_usd REAL DEFAULT 0`) } catch { /* already exists */ }
  try { await db.execute(`ALTER TABLE orders ADD COLUMN tour_breakdown TEXT`) } catch { /* already exists */ }

  console.log('[Packages Schema] Migration complete')
  _packagesMigrated = true
}

// ─── Legacy schema: plans, plan_features, plan_tours ───
// Kept for backward compatibility with code that hasn't been migrated yet

interface SeedLegacyTour {
  name: string
  description: string
  price_per_person_usd: number
}

interface SeedLegacyPlan {
  name: string
  slug: string
  description: string
  price_usd: number
  price_per_person_usd: number
  is_popular: number
  sort_order: number
  features: string[]
  tours: SeedLegacyTour[]
}

const SEED_LEGACY_PLANS: SeedLegacyPlan[] = [
  {
    name: 'Smooth Landing',
    slug: 'smooth-landing',
    description: 'Perfect for the independent traveler who just wants to arrive safe',
    price_usd: 89,
    price_per_person_usd: 0,
    is_popular: 0,
    sort_order: 1,
    features: [
      'VIP Airport Pickup with sign & flight monitoring',
      'Premium SUV/Camioneta transfer',
      'Túnel de Oriente toll covered',
      'Pre-loaded Metro Cívica Card + premium water',
      'SIM/eSIM with high-speed data plan',
    ],
    tours: [],
  },
  {
    name: 'First 24',
    slug: 'first-24',
    description: 'Skip the gringo taxes and master the neighborhood instantly',
    price_usd: 159,
    price_per_person_usd: 30,
    is_popular: 1,
    sort_order: 2,
    features: [
      'Everything in The Welcome Pack',
      '2-hour bilingual Local Fixer at your lobby',
      'VIP Check-in & neighborhood orientation tour',
      'Best ATMs, safe stores & hidden gems',
      'Rappi/delivery apps local optimization',
    ],
    tours: [],
  },
  {
    name: 'Full Insider',
    slug: 'full-insider',
    description: 'Ultimate peace of mind. Zero logistics stress',
    price_usd: 269,
    price_per_person_usd: 40,
    is_popular: 0,
    sort_order: 3,
    features: [
      'Everything in The First 24',
      'Round-trip airport transfer guarantee',
      '24/7 AI WhatsApp Concierge + translation',
      '24/7 human fixer safety net for emergencies',
      'Airbnb accommodation validation before landing',
    ],
    tours: [
      { name: 'Guatape Day Trip', description: 'Pueblo de colores y subida a la Piedra del Penol', price_per_person_usd: 149 },
      { name: 'Coffee Farm Experience', description: 'Finca cafetera y experiencia barista', price_per_person_usd: 119 },
      { name: 'Santa Fe de Antioquia', description: 'Pueblo colonial patrimonio historico', price_per_person_usd: 89 },
      { name: 'Comuna 13 Graffiti Tour', description: 'Recorrido por el arte urbano de Comuna 13', price_per_person_usd: 89 },
      { name: 'Paragliding in San Felix', description: 'Vuelo en parapente sobre el valle de San Felix', price_per_person_usd: 79 },
    ],
  },
]

export async function ensurePlansSchema(): Promise<void> {
  if (_legacyMigrated) return

  // First ensure new schema exists
  await ensurePackagesSchema()

  const db = getDb()

  const tableCheck = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='plans'`)
  const needsMigration = tableCheck.rows.length === 0

  if (!needsMigration) {
    _legacyMigrated = true
    return
  }

  console.log('[Legacy Plans Schema] Running migration...')

  await db.execute(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      price_usd REAL NOT NULL DEFAULT 0,
      price_per_person_usd REAL NOT NULL DEFAULT 0,
      is_popular INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS plan_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS plan_tours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price_per_person_usd REAL NOT NULL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    )
  `)

  // Seed data
  for (const plan of SEED_LEGACY_PLANS) {
    const result = await db.execute({
      sql: `INSERT INTO plans (name, slug, description, price_usd, price_per_person_usd, is_popular, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [plan.name, plan.slug, plan.description, plan.price_usd, plan.price_per_person_usd, plan.is_popular, plan.sort_order],
    })
    const planId = Number(result.lastInsertRowid)

    for (let i = 0; i < plan.features.length; i++) {
      await db.execute({
        sql: 'INSERT INTO plan_features (plan_id, text, sort_order) VALUES (?, ?, ?)',
        args: [planId, plan.features[i], i + 1],
      })
    }

    for (let i = 0; i < plan.tours.length; i++) {
      const tour = plan.tours[i]
      await db.execute({
        sql: 'INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, sort_order) VALUES (?, ?, ?, ?, ?)',
        args: [planId, tour.name, tour.description || '', tour.price_per_person_usd, i + 1],
      })
    }
  }

  console.log('[Legacy Plans Schema] Migration complete')
  _legacyMigrated = true
}

// ─── Legacy trips table ───

interface SeedTrip {
  name: string
  slug: string
  description: string
  price_per_person_usd: number
  sort_order: number
}

const SEED_TRIPS: SeedTrip[] = [
  { name: 'Guatapé / El Peñol Rock', slug: 'guatape', description: 'Tour completo al pueblo de Guatapé y la Piedra del Peñol', price_per_person_usd: 149, sort_order: 1 },
  { name: 'Comuna 13 Graffiti Tour', slug: 'comuna13', description: 'Recorrido por el arte urbano y escaleras eléctricas', price_per_person_usd: 89, sort_order: 2 },
  { name: 'Coffee Farm Experience', slug: 'coffee', description: 'Finca cafetera con experiencia barista incluida', price_per_person_usd: 119, sort_order: 3 },
  { name: 'Santa Fe de Antioquia', slug: 'santa-fe', description: 'Pueblo colonial patrimonio histórico', price_per_person_usd: 89, sort_order: 4 },
  { name: 'Paragliding in San Félix', slug: 'paragliding', description: 'Vuelo en parapente sobre el valle de San Félix', price_per_person_usd: 79, sort_order: 5 },
]

export async function ensureTripsSchema(): Promise<void> {
  if (_tripsMigrated) return

  const db = getDb()

  const tableCheck = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='trips'`)
  const needsMigration = tableCheck.rows.length === 0

  if (!needsMigration) {
    _tripsMigrated = true
    return
  }

  console.log('[Trips Schema] Running migration...')

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      price_per_person_usd REAL NOT NULL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  for (let i = 0; i < SEED_TRIPS.length; i++) {
    const trip = SEED_TRIPS[i]
    await db.execute({
      sql: `INSERT INTO trips (name, slug, description, price_per_person_usd, sort_order) VALUES (?, ?, ?, ?, ?)`,
      args: [trip.name, trip.slug, trip.description, trip.price_per_person_usd, trip.sort_order],
    })
  }

  console.log('[Trips Schema] Migration complete')
  _tripsMigrated = true
}
