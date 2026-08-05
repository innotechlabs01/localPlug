import { getDb } from '@/lib/db'

let _migrated = false

interface SeedTour {
  name: string
  description: string
  price_per_person_usd: number
}

interface SeedPlan {
  name: string
  slug: string
  description: string
  price_usd: number
  price_per_person_usd: number
  is_popular: number
  sort_order: number
  features: string[]
  tours: SeedTour[]
}

const SEED_PLANS: SeedPlan[] = [
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
  if (_migrated) return

  const db = getDb()

  const tableCheck = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='plans'`)
  const needsMigration = tableCheck.rows.length === 0

  if (!needsMigration) {
    _migrated = true
    return
  }

  console.log('[Plans Schema] Running migration...')

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
  for (const plan of SEED_PLANS) {
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

  console.log('[Plans Schema] Migration complete')
  _migrated = true
}

let _tripsMigrated = false

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
