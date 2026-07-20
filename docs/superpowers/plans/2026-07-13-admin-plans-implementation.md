# Admin-Editable Plans with Dynamic Pricing + TRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded landing page pricing with admin-editable plans that include tours with per-person costs, display TRM exchange rate during payment, and send calculated totals to Paddle.

**Architecture:** New `plans`, `plan_features`, `plan_tours` tables in SQLite. Admin CRUD at `/admin/plans`. Public API at `/api/plans`. Landing page fetches from API. Payment flow calculates plan + tours × people and sends to Paddle. TRM fetched from exchange rate API.

**Tech Stack:** Next.js 15, libsql/Drizzle ORM, SQLite, Paddle, Clerk auth

---

## File Structure

**New files:**
- `lib/db/migrate-plans.ts` — migration for plans tables + seed data
- `app/api/admin/plans/route.ts` — admin CRUD API
- `app/api/admin/plans/features/route.ts` — features batch API
- `app/api/admin/plans/tours/route.ts` — tours batch API
- `app/api/admin/plans/reorder/route.ts` — reorder API
- `app/api/plans/route.ts` — public plans API
- `app/api/trm/route.ts` — TRM exchange rate API
- `app/admin/plans/page.tsx` — admin plans page

**Modified files:**
- `lib/db/migrate-auto.ts` — add plans module
- `lib/i18n/locales/en.ts` — add plans admin translations
- `lib/i18n/locales/es.ts` — add plans admin translations
- `app/admin/layout.tsx` — add Plans nav item
- `app/components/pricing/pricing-section.tsx` — fetch from API
- `app/api/payments/create-intent/route.ts` — plan-based pricing
- `lib/settings.ts` — add plan pricing functions

---

## Task 1: Database Migration

**Files:**
- Create: `lib/db/migrate-plans.ts`

- [ ] **Step 1: Create migration file**

```typescript
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
```

- [ ] **Step 2: Call migration from app startup**

Modify `lib/db/migrate-auto.ts` to import and call `ensurePlansSchema`:

```typescript
import { ensurePlansSchema } from './migrate-plans'

// Add at end of ensureSchema():
await ensurePlansSchema()
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/migrate-plans.ts lib/db/migrate-auto.ts
git commit -m "feat: add plans tables migration with seed data"
```

---

## Task 2: Admin Plans Module Permission

**Files:**
- Modify: `lib/db/migrate-auto.ts:5-21`

- [ ] **Step 1: Add plans module to MODULES array**

```typescript
const MODULES = [
  // ... existing modules ...
  { name: 'Plans', slug: 'plans', icon: 'CreditCard', sort: 16 },
]
```

- [ ] **Step 2: Add restricted permissions for plans**

```typescript
const RESTRICTED_MODULES: Record<string, Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }>> = {
  // ... existing modules ...
  plans: {
    viewer: { view: true, create: false, update: false, delete: false },
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/migrate-auto.ts
git commit -m "feat: add plans module permission"
```

---

## Task 3: Admin Plans API

**Files:**
- Create: `app/api/admin/plans/route.ts`

- [ ] **Step 1: Create GET handler**

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('plans', 'view')
  if (authError) return authError

  const db = getDb()
  
  const plansResult = await db.execute('SELECT * FROM plans ORDER BY sort_order ASC')
  const plans = plansResult.rows || []

  const plansWithDetails = await Promise.all(plans.map(async (plan: any) => {
    const featuresResult = await db.execute({
      sql: 'SELECT * FROM plan_features WHERE plan_id = ? ORDER BY sort_order',
      args: [plan.id],
    })
    
    const toursResult = await db.execute({
      sql: 'SELECT * FROM plan_tours WHERE plan_id = ? ORDER BY sort_order',
      args: [plan.id],
    })

    return {
      ...plan,
      features: featuresResult.rows || [],
      tours: toursResult.rows || [],
    }
  }))

  return NextResponse.json({ plans: plansWithDetails })
}
```

- [ ] **Step 2: Create POST handler**

```typescript
export async function POST(req: Request) {
  const authError = await requirePermission('plans', 'create')
  if (authError) return authError

  const body = await req.json()
  const { name, slug, description, price_usd, is_popular, is_active, sort_order, features, tours } = body

  if (!name) {
    return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
  }

  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const db = getDb()

  const existing = await db.execute({ sql: 'SELECT id FROM plans WHERE slug = ?', args: [finalSlug] })
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'A plan with this slug already exists' }, { status: 409 })
  }

  const result = await db.execute({
    sql: `INSERT INTO plans (name, slug, description, price_usd, is_popular, is_active, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      name, finalSlug, description || '', price_usd || 0,
      is_popular ? 1 : 0, is_active !== false ? 1 : 0, sort_order || 0,
    ],
  })

  const planId = Number(result.lastInsertRowid)

  // Insert features
  if (features && Array.isArray(features)) {
    for (let i = 0; i < features.length; i++) {
      await db.execute({
        sql: 'INSERT INTO plan_features (plan_id, text, sort_order) VALUES (?, ?, ?)',
        args: [planId, features[i], i + 1],
      })
    }
  }

  // Insert tours
  if (tours && Array.isArray(tours)) {
    for (let i = 0; i < tours.length; i++) {
      const tour = tours[i]
      await db.execute({
        sql: 'INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        args: [planId, tour.name, tour.description || '', tour.price_per_person_usd || 0, tour.is_active !== false ? 1 : 0, i + 1],
      })
    }
  }

  return NextResponse.json({ success: true, id: planId, slug: finalSlug })
}
```

- [ ] **Step 3: Create PUT handler**

```typescript
export async function PUT(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { id, name, slug, description, price_usd, is_popular, is_active, sort_order } = body

  if (!id) return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })

  const db = getDb()
  const setClauses: string[] = []
  const args: any[] = []

  if (name !== undefined) { setClauses.push('name = ?'); args.push(name) }
  if (slug !== undefined) { setClauses.push('slug = ?'); args.push(slug) }
  if (description !== undefined) { setClauses.push('description = ?'); args.push(description) }
  if (price_usd !== undefined) { setClauses.push('price_usd = ?'); args.push(price_usd) }
  if (is_popular !== undefined) { setClauses.push('is_popular = ?'); args.push(is_popular ? 1 : 0) }
  if (is_active !== undefined) { setClauses.push('is_active = ?'); args.push(is_active ? 1 : 0) }
  if (sort_order !== undefined) { setClauses.push('sort_order = ?'); args.push(sort_order) }

  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  setClauses.push("updated_at = datetime('now')")
  args.push(id)

  await db.execute({
    sql: `UPDATE plans SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Create DELETE handler**

```typescript
export async function DELETE(req: Request) {
  const authError = await requirePermission('plans', 'delete')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })

  const db = getDb()
  await db.execute({ sql: 'DELETE FROM plans WHERE id = ?', args: [parseInt(id)] })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/plans/route.ts
git commit -m "feat: add admin plans CRUD API"
```

---

## Task 4: Admin Plans Features & Tours API

**Files:**
- Create: `app/api/admin/plans/features/route.ts`
- Create: `app/api/admin/plans/tours/route.ts`

- [ ] **Step 1: Create features API**

```typescript
// app/api/admin/plans/features/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { plan_id, features } = body as { plan_id: number; features: { id?: number; text: string; sort_order: number }[] }

  if (!plan_id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })

  const db = getDb()

  // Delete existing features
  await db.execute({ sql: 'DELETE FROM plan_features WHERE plan_id = ?', args: [plan_id] })

  // Insert new features
  for (const feature of features) {
    await db.execute({
      sql: 'INSERT INTO plan_features (plan_id, text, sort_order) VALUES (?, ?, ?)',
      args: [plan_id, feature.text, feature.sort_order],
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Feature ID required' }, { status: 400 })

  const db = getDb()
  await db.execute({ sql: 'DELETE FROM plan_features WHERE id = ?', args: [parseInt(id)] })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create tours API**

```typescript
// app/api/admin/plans/tours/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function POST(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { plan_id, tours } = body as { plan_id: number; tours: { id?: number; name: string; description?: string; price_per_person_usd: number; is_active: boolean; sort_order: number }[] }

  if (!plan_id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })

  const db = getDb()

  // Delete existing tours
  await db.execute({ sql: 'DELETE FROM plan_tours WHERE plan_id = ?', args: [plan_id] })

  // Insert new tours
  for (const tour of tours) {
    await db.execute({
      sql: 'INSERT INTO plan_tours (plan_id, name, description, price_per_person_usd, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      args: [plan_id, tour.name, tour.description || '', tour.price_per_person_usd, tour.is_active ? 1 : 0, tour.sort_order],
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Tour ID required' }, { status: 400 })

  const db = getDb()
  await db.execute({ sql: 'DELETE FROM plan_tours WHERE id = ?', args: [parseInt(id)] })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/plans/features/route.ts app/api/admin/plans/tours/route.ts
git commit -m "feat: add admin plans features and tours API"
```

---

## Task 5: Admin Plans Reorder API

**Files:**
- Create: `app/api/admin/plans/reorder/route.ts`

- [ ] **Step 1: Create reorder API**

```typescript
// app/api/admin/plans/reorder/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function PUT(req: Request) {
  const authError = await requirePermission('plans', 'update')
  if (authError) return authError

  const body = await req.json()
  const { orders } = body as { orders: { id: number; sort_order: number }[] }

  if (!orders || !Array.isArray(orders)) {
    return NextResponse.json({ error: 'Orders array required' }, { status: 400 })
  }

  const db = getDb()

  for (const item of orders) {
    await db.execute({
      sql: "UPDATE plans SET sort_order = ?, updated_at = datetime('now') WHERE id = ?",
      args: [item.sort_order, item.id],
    })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/plans/reorder/route.ts
git commit -m "feat: add admin plans reorder API"
```

---

## Task 6: Public Plans API

**Files:**
- Create: `app/api/plans/route.ts`

- [ ] **Step 1: Create public API**

```typescript
// app/api/plans/route.ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    
    const plansResult = await db.execute('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order ASC')
    const plans = plansResult.rows || []

    const plansWithDetails = await Promise.all(plans.map(async (plan: any) => {
      const featuresResult = await db.execute({
        sql: 'SELECT text FROM plan_features WHERE plan_id = ? ORDER BY sort_order',
        args: [plan.id],
      })
      
      const toursResult = await db.execute({
        sql: 'SELECT name, description, price_per_person_usd FROM plan_tours WHERE plan_id = ? AND is_active = 1 ORDER BY sort_order',
        args: [plan.id],
      })

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price_usd: plan.price_usd,
        is_popular: plan.is_popular === 1,
        features: featuresResult.rows.map((r: any) => r.text) || [],
        tours: toursResult.rows || [],
      }
    }))

    return NextResponse.json({ plans: plansWithDetails })
  } catch (error) {
    console.error('[Plans API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/plans/route.ts
git commit -m "feat: add public plans API"
```

---

## Task 7: TRM Exchange Rate API

**Files:**
- Create: `app/api/trm/route.ts`

- [ ] **Step 1: Create TRM API with caching**

```typescript
// app/api/trm/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

let cachedRate: { rate: number; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    // Return cached rate if valid
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
      return NextResponse.json({ 
        rate: cachedRate.rate, 
        currency: 'USD',
        target: 'COP',
        cached: true 
      })
    }

    // Fetch fresh rate from free API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 300 }, // 5 min cache
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate')
    }

    const data = await response.json()
    const copRate = data.rates?.COP

    if (!copRate) {
      throw new Error('COP rate not found')
    }

    // Update cache
    cachedRate = { rate: copRate, timestamp: Date.now() }

    return NextResponse.json({ 
      rate: copRate, 
      currency: 'USD',
      target: 'COP',
      cached: false 
    })
  } catch (error) {
    console.error('[TRM API] Error:', error)
    
    // Return fallback rate if API fails
    const fallbackRate = 4200 // Approximate COP rate
    return NextResponse.json({ 
      rate: fallbackRate, 
      currency: 'USD',
      target: 'COP',
      cached: false,
      fallback: true 
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/trm/route.ts
git commit -m "feat: add TRM exchange rate API with caching"
```

---

## Task 8: Admin Plans i18n Translations

**Files:**
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/es.ts`

- [ ] **Step 1: Add English translations**

```typescript
// In admin.nav section:
plans: 'Plans',

// New admin.plans section:
plans: {
  title: 'Plans Management',
  subtitle: 'Manage pricing plans and tours',
  addPlan: 'Add Plan',
  editPlan: 'Edit Plan',
  planName: 'Plan Name',
  slug: 'Slug',
  description: 'Description',
  priceUsd: 'Price (USD)',
  isPopular: 'Most Popular',
  isActive: 'Active',
  sortOrder: 'Sort Order',
  features: 'Features',
  addFeature: 'Add Feature',
  tours: 'Tours',
  addTour: 'Add Tour',
  tourName: 'Tour Name',
  pricePerPerson: 'Price Per Person (USD)',
  actions: 'Actions',
  deleteConfirm: 'Are you sure you want to delete this plan?',
  noPlans: 'No plans yet. Create your first plan!',
},
```

- [ ] **Step 2: Add Spanish translations**

```typescript
// In admin.nav section:
plans: 'Planes',

// New admin.plans section:
plans: {
  title: 'Gestión de Planes',
  subtitle: 'Administrar planes de precios y tours',
  addPlan: 'Agregar Plan',
  editPlan: 'Editar Plan',
  planName: 'Nombre del Plan',
  slug: 'Slug',
  description: 'Descripción',
  priceUsd: 'Precio (USD)',
  isPopular: 'Más Popular',
  isActive: 'Activo',
  sortOrder: 'Orden',
  features: 'Características',
  addFeature: 'Agregar Característica',
  tours: 'Tours',
  addTour: 'Agregar Tour',
  tourName: 'Nombre del Tour',
  pricePerPerson: 'Precio Por Persona (USD)',
  actions: 'Acciones',
  deleteConfirm: '¿Estás seguro de que quieres eliminar este plan?',
  noPlans: '¡No hay planes aún. Crea tu primer plan!',
},
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/locales/en.ts lib/i18n/locales/es.ts
git commit -m "feat: add plans i18n translations"
```

---

## Task 9: Admin Plans Page

**Files:**
- Create: `app/admin/plans/page.tsx`

- [ ] **Step 1: Create admin plans page**

```tsx
// app/admin/plans/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface PlanFeature {
  id?: number
  text: string
  sort_order: number
}

interface PlanTour {
  id?: number
  name: string
  description: string
  price_per_person_usd: number
  is_active: boolean
  sort_order: number
}

interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price_usd: number
  is_popular: number
  is_active: number
  sort_order: number
  features: PlanFeature[]
  tours: PlanTour[]
}

export default function PlansPage() {
  const { t } = useI18n()
  const { showToast } = useToast()

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [features, setFeatures] = useState<PlanFeature[]>([])
  const [tours, setTours] = useState<PlanTour[]>([])
  const [saving, setSaving] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      const data = await adminFetch('/api/admin/plans')
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const openModal = (plan?: Plan) => {
    if (plan) {
      setEditPlan(plan)
      setForm({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price_usd: plan.price_usd,
        is_popular: plan.is_popular === 1,
        is_active: plan.is_active === 1,
        sort_order: plan.sort_order,
      })
      setFeatures(plan.features || [])
      setTours(plan.tours || [])
    } else {
      setEditPlan(null)
      setForm({
        name: '',
        slug: '',
        description: '',
        price_usd: 0,
        is_popular: false,
        is_active: true,
        sort_order: plans.length + 1,
      })
      setFeatures([])
      setTours([])
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditPlan(null)
    setForm({})
    setFeatures([])
    setTours([])
  }

  const addFeature = () => {
    if (features.length >= 8) {
      showToast('Maximum 8 features allowed', 'error')
      return
    }
    setFeatures([...features, { text: '', sort_order: features.length + 1 }])
  }

  const updateFeature = (index: number, text: string) => {
    const updated = [...features]
    updated[index] = { ...updated[index], text }
    setFeatures(updated)
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const addTour = () => {
    setTours([...tours, { 
      name: '', 
      description: '', 
      price_per_person_usd: 0, 
      is_active: true, 
      sort_order: tours.length + 1 
    }])
  }

  const updateTour = (index: number, field: keyof PlanTour, value: any) => {
    const updated = [...tours]
    updated[index] = { ...updated[index], [field]: value }
    setTours(updated)
  }

  const removeTour = (index: number) => {
    setTours(tours.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!form.name) {
      showToast('Plan name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const planData = {
        ...form,
        features: features.filter(f => f.text.trim()),
        tours: tours.filter(t => t.name.trim()),
      }

      if (editPlan) {
        await adminFetch('/api/admin/plans', {
          method: 'PUT',
          body: JSON.stringify({ id: editPlan.id, ...planData }),
        })
        showToast('Plan updated successfully', 'success')
      } else {
        await adminFetch('/api/admin/plans', {
          method: 'POST',
          body: JSON.stringify(planData),
        })
        showToast('Plan created successfully', 'success')
      }

      closeModal()
      fetchPlans()
    } catch (error) {
      showToast('Failed to save plan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (planId: number) => {
    if (!confirm(t.admin.plans.deleteConfirm)) return

    try {
      await adminFetch(`/api/admin/plans?id=${planId}`, { method: 'DELETE' })
      showToast('Plan deleted successfully', 'success')
      fetchPlans()
    } catch (error) {
      showToast('Failed to delete plan', 'error')
    }
  }

  const handleReorder = async (planId: number, newSortOrder: number) => {
    try {
      const orders = plans.map((p, i) => ({
        id: p.id,
        sort_order: p.id === planId ? newSortOrder : p.sort_order,
      }))
      await adminFetch('/api/admin/plans/reorder', {
        method: 'PUT',
        body: JSON.stringify({ orders }),
      })
      fetchPlans()
    } catch (error) {
      showToast('Failed to reorder plans', 'success')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.plans.title}</h1>
          <p className="text-gray-500">{t.admin.plans.subtitle}</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t.admin.plans.addPlan}
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t.admin.plans.noPlans}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.plans.planName}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.plans.priceUsd}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.plans.isPopular}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.plans.isActive}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.plans.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{plan.name}</div>
                    <div className="text-sm text-gray-500">{plan.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${plan.price_usd}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {plan.is_popular ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Popular
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.tours.length} tours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openModal(plan)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {editPlan ? t.admin.plans.editPlan : t.admin.plans.addPlan}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.admin.plans.planName}
                </label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.admin.plans.description}
                </label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.admin.plans.priceUsd}
                  </label>
                  <input
                    type="number"
                    value={form.price_usd || 0}
                    onChange={(e) => setForm({ ...form, price_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.admin.plans.sortOrder}
                  </label>
                  <input
                    type="number"
                    value={form.sort_order || 0}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.is_popular || false}
                    onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t.admin.plans.isPopular}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.is_active !== false}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t.admin.plans.isActive}</span>
                </label>
              </div>

              {/* Features */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t.admin.plans.features} ({features.length}/8)
                  </label>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    + {t.admin.plans.addFeature}
                  </button>
                </div>
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature.text}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                        placeholder={`Feature ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tours */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t.admin.plans.tours}
                  </label>
                  <button
                    type="button"
                    onClick={addTour}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    + {t.admin.plans.addTour}
                  </button>
                </div>
                <div className="space-y-3">
                  {tours.map((tour, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          value={tour.name}
                          onChange={(e) => updateTour(index, 'name', e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2"
                          placeholder={t.admin.plans.tourName}
                        />
                        <input
                          type="number"
                          value={tour.price_per_person_usd}
                          onChange={(e) => updateTour(index, 'price_per_person_usd', parseFloat(e.target.value) || 0)}
                          className="border border-gray-300 rounded-lg px-3 py-2"
                          placeholder={t.admin.plans.pricePerPerson}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tour.description}
                          onChange={(e) => updateTour(index, 'description', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Description (optional)"
                        />
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={tour.is_active}
                            onChange={(e) => updateTour(index, 'is_active', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="ml-1 text-sm">Active</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeTour(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/plans/page.tsx
git commit -m "feat: add admin plans page"
```

---

## Task 10: Admin Sidebar Navigation

**Files:**
- Modify: `app/admin/layout.tsx:100-158`

- [ ] **Step 1: Add Plans nav item to Management section**

```typescript
{
  labelKey: 'plans',
  href: '/admin/plans',
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
},
```

- [ ] **Step 2: Add to navItemSlug map**

```typescript
const navItemSlug: Record<string, string> = {
  // ... existing mappings ...
  '/admin/plans': 'plans',
}
```

- [ ] **Step 3: Add to pageTitleMap**

```typescript
const pageTitleMap: Record<string, string> = {
  // ... existing mappings ...
  '/admin/plans': t.admin.plans?.title || 'Plans',
}
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add plans to admin sidebar navigation"
```

---

## Task 11: Landing Page Update

**Files:**
- Modify: `app/components/pricing/pricing-section.tsx`

- [ ] **Step 1: Update pricing section to fetch from API**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/app/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'

interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price_usd: number
  is_popular: boolean
  features: string[]
  tours: { name: string; description: string; price_per_person_usd: number }[]
}

export default function PricingSection() {
  const { t } = useI18n()
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.1 })
  
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans')
        const data = await response.json()
        
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans)
        } else {
          // Fallback to i18n
          const i18nPlans = t.pricing.plans.map((plan: any, i: number) => ({
            id: i + 1,
            name: plan.name,
            slug: ['welcome-pack', '24h-insider', 'medellin-freedom-pass'][i],
            description: plan.desc,
            price_usd: [89, 159, 269][i],
            is_popular: i === 1,
            features: plan.features,
            tours: [],
          }))
          setPlans(i18nPlans)
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error)
        // Fallback to i18n
        const i18nPlans = t.pricing.plans.map((plan: any, i: number) => ({
          id: i + 1,
          name: plan.name,
          slug: ['welcome-pack', '24h-insider', 'medellin-freedom-pass'][i],
          description: plan.desc,
          price_usd: [89, 159, 269][i],
          is_popular: i === 1,
          features: plan.features,
          tours: [],
        }))
        setPlans(i18nPlans)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [t])

  if (loading) {
    return null
  }

  return (
    <section id="pricing" className="py-[120px]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.pricing.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        <div ref={gridRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto stagger-children ${gridVisible ? 'visible' : ''}`}>
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`relative bg-[var(--bg-card)] border rounded-[var(--radius-xl)] p-10 transition-all duration-300 hover:-translate-y-1 ${
                plan.is_popular
                  ? 'border-[var(--accent-gold)] bg-gradient-to-b from-[rgba(212,165,116,0.08)] to-[var(--bg-card)] shadow-[0_0_60px_rgba(212,165,116,0.15)] hover:shadow-[0_0_80px_rgba(212,165,116,0.2)]'
                  : 'border-[var(--border)] hover:border-[var(--accent-gold)] hover:shadow-[0_12px_40px_rgba(212,165,116,0.1)]'
              }`}
            >
              {plan.is_popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-[var(--bg-dark)] px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[.05em] shadow-[0_2px_8px_rgba(212,165,116,0.3)]">
                  {t.pricing.popular}
                </span>
              )}

              <h3 className="text-[22px] font-semibold text-white mb-2">{plan.name}</h3>
              <div className="text-[42px] font-bold text-[var(--accent-gold)] mb-2">
                ${plan.price_usd}
                <span className="text-[15px] text-[var(--text-muted)] font-normal"> {t.pricing.starting}</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-7">{plan.description}</p>

              {plan.tours.length > 0 && (
                <div className="mb-4 p-3 bg-[rgba(212,165,116,0.1)] rounded-lg">
                  <p className="text-xs text-[var(--accent-gold)] font-medium mb-1">Tours included:</p>
                  {plan.tours.map((tour, i) => (
                    <p key={i} className="text-xs text-[var(--text-secondary)]">
                      {tour.name} - ${tour.price_per_person_usd}/person
                    </p>
                  ))}
                </div>
              )}

              <ul className="space-y-1 mb-8" role="list">
                {plan.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-3 py-2.5 text-sm text-[var(--text-secondary)] border-b border-[var(--border)]">
                    <span className="w-5 h-5 rounded-full bg-[rgba(212,165,116,0.2)] text-[var(--accent-gold)] flex items-center justify-center text-[11px] shrink-0" aria-hidden="true">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={`/booking?plan=${plan.slug}`} className="block">
                <Button variant={plan.is_popular ? 'primary' : 'secondary'} className="w-full">
                  {t.pricing.selectPlan}
                </Button>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/pricing/pricing-section.tsx
git commit -m "feat: update landing page to fetch plans from API"
```

---

## Task 12: Payment API Update

**Files:**
- Modify: `app/api/payments/create-intent/route.ts`
- Modify: `lib/settings.ts`

- [ ] **Step 1: Add plan pricing functions to settings.ts**

```typescript
// Add at end of lib/settings.ts:

export async function getPlanById(planId: number): Promise<any> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM plans WHERE id = ?',
    args: [planId],
  })
  return result.rows[0] || null
}

export async function getPlanBySlug(slug: string): Promise<any> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM plans WHERE slug = ?',
    args: [slug],
  })
  return result.rows[0] || null
}

export async function getPlanTours(planId: number): Promise<any[]> {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM plan_tours WHERE plan_id = ? AND is_active = 1',
    args: [planId],
  })
  return result.rows || []
}

export async function calculatePlanTotal(
  planId: number, 
  tourIds: number[], 
  numPeople: number
): Promise<{ subtotal: number; toursCost: number; total: number }> {
  const plan = await getPlanById(planId)
  if (!plan) return { subtotal: 0, toursCost: 0, total: 0 }

  const planPrice = plan.price_usd
  let toursCost = 0

  if (tourIds.length > 0 && numPeople > 0) {
    const tours = await getPlanTours(planId)
    const selectedTours = tours.filter(t => tourIds.includes(t.id))
    toursCost = selectedTours.reduce((sum, tour) => sum + tour.price_per_person_usd, 0) * numPeople
  }

  const subtotal = planPrice + toursCost
  return { subtotal, toursCost, total: subtotal }
}
```

- [ ] **Step 2: Update create-intent route**

```typescript
// Update the POST handler in app/api/payments/create-intent/route.ts:

import { calculatePlanTotal, getPlanById } from '@/lib/settings'

// In the POST handler, replace package calculation with plan calculation:

export async function POST(req: Request) {
  const rateLimitResponse = await rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const { bookingReference, planId, planSlug, tourIds, numPeople, customerEmail, customerName, customerPhone, flightNumber, airline, arrivalDate, arrivalTime, needReturn } = body as {
      bookingReference: string
      planId?: number
      planSlug?: string
      tourIds?: number[]
      numPeople?: number
      customerEmail: string
      customerName: string
      customerPhone?: string
      flightNumber?: string
      airline?: string
      arrivalDate?: string
      arrivalTime?: string
      needReturn?: boolean
    }

    if (!bookingReference || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Missing required fields' },
        { status: 400 },
      )
    }

    let amount = 0
    let packageName = ''
    let packageId = ''

    // Plan-based pricing (new flow)
    if (planId || planSlug) {
      const plan = planId 
        ? await getPlanById(planId)
        : await getPlanBySlug(planSlug!)
      
      if (!plan) {
        return NextResponse.json(
          { error: 'invalid_request', message: 'Invalid plan' },
          { status: 400 },
        )
      }

      const { total } = await calculatePlanTotal(
        plan.id, 
        tourIds || [], 
        numPeople || 1
      )

      // Apply service fee and tax (existing logic)
      const serviceFee = await getServiceFee()
      const taxRate = await getTaxRate()
      const iva = (total - serviceFee) * taxRate
      amount = Math.round((total + serviceFee + iva) * 100) // Convert to cents

      packageName = plan.name
      packageId = `plan_${plan.id}`
    } else {
      // Legacy package-based pricing (existing flow)
      const baseAmount = await getConfigPackagePriceCents(packageId)
      if (baseAmount === 0) {
        return NextResponse.json(
          { error: 'invalid_request', message: 'Invalid package ID' },
          { status: 400 },
        )
      }

      amount = await getConfigPackageGrandTotalCents(packageId, !!needReturn)
      packageName = await getConfigPackageName(packageId)
    }

    if (await hasPayment(bookingReference)) {
      const existing = await getPayment(bookingReference)
      if (existing?.status === 'completed' || existing?.status === 'pending') {
        return NextResponse.json(
          { error: 'duplicate_payment', message: 'This booking already has a payment in progress.' },
          { status: 409 },
        )
      }
    }

    const currency = await getDefaultCurrency()

    const items = [
      {
        description: packageName,
        name: packageId,
        unitPrice: { amount: formatPaddleAmount(amount), currencyCode: currency },
        quantity: 1,
      },
    ]

    const txn = await createTransaction({
      items,
      customData: {
        booking_reference: bookingReference,
        package_id: packageId,
        plan_id: planId || null,
        tour_ids: JSON.stringify(tourIds || []),
        num_people: numPeople || 1,
        need_return: String(!!needReturn),
      },
      customer: { email: customerEmail, name: customerName },
    })

    const now = new Date().toISOString()
    const record: PaymentRecord = {
      booking_reference: bookingReference,
      package_id: packageId,
      package_name: packageName,
      amount,
      currency,
      status: 'pending',
      paddle_transaction_id: txn.id,
      paddle_webhook_event_id: '',
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone || '',
      error_message: null,
      created_at: now,
      updated_at: now,
    }
    await setPayment(record)

    return NextResponse.json({ transactionId: txn.id, amount })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json(
      { error: 'server_error', message },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/settings.ts app/api/payments/create-intent/route.ts
git commit -m "feat: update payment API to support plan-based pricing"
```

---

## Task 13: Build Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build/lint issues"
```

---

## Task 14: Final Commit

- [ ] **Step 1: Create feature branch and push**

```bash
git checkout -b feat/admin-plans
git add -A
git commit -m "feat: admin-editable plans with dynamic pricing and TRM"
git push -u origin feat/admin-plans
```

- [ ] **Step 2: Create PR**

```bash
gh pr create --base develop --title "feat: Admin-Editable Plans with Dynamic Pricing + TRM" --body "Implements admin-editable plans with tours, dynamic pricing, and TRM exchange rate display."
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-13-admin-plans-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
