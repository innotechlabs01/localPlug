import { getDb } from '@/lib/db'

let _migrated = false

const SEED_PLANS = [
  {
    name: 'The Welcome Pack',
    slug: 'welcome-pack',
    description: 'Perfect for the independent traveler who just wants to arrive safe',
    price_usd: 89,
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
    name: 'The 24h Insider',
    slug: '24h-insider',
    description: 'Skip the gringo taxes and master the neighborhood instantly',
    price_usd: 159,
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
    name: 'The Medellin Freedom Pass',
    slug: 'medellin-freedom-pass',
    description: 'Ultimate peace of mind. Zero logistics stress',
    price_usd: 269,
    is_popular: 0,
    sort_order: 3,
    features: [
      'Everything in The 24h Insider',
      'Round-trip airport transfer guarantee',
      '24/7 AI WhatsApp Concierge + translation',
      '24/7 human fixer safety net for emergencies',
      'Airbnb accommodation validation before landing',
    ],
    tours: [],
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
      sql: `INSERT INTO plans (name, slug, description, price_usd, is_popular, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [plan.name, plan.slug, plan.description, plan.price_usd, plan.is_popular, plan.sort_order],
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
