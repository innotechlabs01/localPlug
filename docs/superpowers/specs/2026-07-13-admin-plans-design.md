# Design: Admin-Editable Plans with Dynamic Pricing + TRM

## Overview

Replace hardcoded landing page pricing with admin-editable plans. Plans can include tours with per-person costs. All prices are parametrizable from admin. TRM (USD→COP exchange rate) shown during payment. All calculated prices flow to Paddle.

## Data Model

### `plans` table
```sql
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
```

### `plan_features` table
```sql
CREATE TABLE IF NOT EXISTS plan_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
)
```

### `plan_tours` table
```sql
CREATE TABLE IF NOT EXISTS plan_tours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_person_usd REAL NOT NULL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
)
```

### Seed Data
Auto-populate from current i18n `t.pricing.plans` (3 plans) on first migration.

## API Endpoints

### Admin APIs (require permission `plans`)
- `GET /api/admin/plans` — list all plans with features + tours
- `POST /api/admin/plans` — create plan
- `PUT /api/admin/plans` — update plan (name, desc, price, is_popular, is_active, sort_order)
- `DELETE /api/admin/plans?id=<id>` — delete plan + cascade features/tours
- `POST /api/admin/plans/features` — add/update/delete features (batch)
- `POST /api/admin/plans/tours` — add/update/delete tours (batch)
- `PUT /api/admin/plans/reorder` — update sort_order for multiple plans

### Public APIs
- `GET /api/plans` — active plans only, ordered by sort_order (for landing page)
- `GET /api/trm` — fetch current USD→COP exchange rate (cached 5min)

### Payment API Update
- `POST /api/payments/create-intent` — receives `plan_id`, `tour_ids[]`, `num_people`
  - Calculates: `plan.price_usd + sum(tour.price_per_person_usd × num_people)`
  - Applies service fee + IVA (existing logic)
  - Sends same total to Paddle
  - Stores plan_id + tour breakdown in payment record

## Admin UI — `/admin/plans`

### Layout
Table view with:
- Drag-to-reorder rows (sort_order)
- Columns: Name, Price USD, Popular badge, Active toggle, Tours count, Actions
- "Add Plan" button → modal form

### Plan Modal Form
- Name, Slug (auto-generated), Description, Price USD, Is Popular toggle, Is Active toggle
- Features section: dynamic list of text inputs, max 8, add/remove buttons
- Tours section: table with Name, Description, Price Per Person USD, Active toggle, add/remove rows

### Permission
`plans` module added to `migrate-auto.ts` MODULES array (admin + manager can CRUD, viewer read-only).

## Landing Page + Payment Flow

### Landing Page (`pricing-section.tsx`)
- Fetches `GET /api/plans` on mount
- Falls back to i18n if API returns empty
- Displays: name, description, price, features, tours with per-person price
- "Most Popular" badge from `is_popular` field
- "Select Plan" links to `/booking?plan=<slug>`

### Booking Flow
- Reads `plan` query param → fetches plan details
- Shows plan price + selected tours × num_people
- Displays TRM rate: "1 USD = X COP" (fetched from `/api/trm`)
- Shows total in USD with COP equivalent

### Payment (Paddle)
- `create-intent` receives: `plan_id`, `tour_ids[]`, `num_people`
- Server calculates: `plan.price_usd + sum(tour.price_per_person_usd × num_people)`
- Applies existing service fee + IVA
- Sends to Paddle: same total amount in USD
- Payment record stores: `plan_id`, `tour_ids`, `num_people`, `trm_rate`, `total_cop`

## Implementation Order

1. DB migration (tables + seed data)
2. Admin API routes
3. Public API routes (`/api/plans`, `/api/trm`)
4. Admin UI page (`/admin/plans`)
5. Landing page update (`pricing-section.tsx`)
6. Booking flow update (plan param + TRM display)
7. Payment API update (plan-based pricing → Paddle)
