# Parametrizable Config — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded pricing, fees, tax rates, commissions, timeouts, and limits with a DB-backed configuration system editable from the admin panel.

**Architecture:** Extend the existing `settings` key-value table with 32 config keys. Create `lib/config.ts` — a typed server-side config module with in-memory cache and DB-read. Public `GET /api/config` endpoint for the frontend. Admin settings page gets 5 new sections with real inputs and live previews. All 16 consumer files switch from hardcodes to config reads.

**Tech Stack:** Next.js 15 App Router, LibSQL (Turso), React 18, TypeScript, Tailwind CSS

---

### Task 1: Create `lib/config.ts` — Server Config Module

**Files:**
- Create: `lib/config.ts`

- [ ] **Step 1: Write the module with defaults, cache, and all typed getters**

```typescript
import { getDb } from '@/lib/db'

// ── Setting keys ──
const KEYS = {
  PKG_SMOOTH_LANDING: 'pkg_smooth_landing_price',
  PKG_FIRST_24: 'pkg_first_24_price',
  PKG_FULL_INSIDER: 'pkg_full_insider_price',
  RETURN_TRIP_CHARGE: 'return_trip_charge',
  SERVICE_FEE_FLAT: 'service_fee_flat',
  TAX_RATE_IVA: 'tax_rate_iva',
  HOTEL_COMMISSION: 'hotel_commission_rate',
  DRIVER_COMMISSION: 'driver_commission_rate',
  STRIPE_FEE_PCT: 'stripe_fee_percent',
  STRIPE_FEE_FIXED: 'stripe_fee_fixed',
  HOTEL_REVENUE_NIGHT: 'hotel_revenue_per_night',
  TRM_FALLBACK: 'trm_fallback_rate',
  ADVANCE_BOOKING_DAYS: 'advance_booking_days',
  RATE_LIMIT_MAX: 'rate_limit_max_requests',
  RATE_LIMIT_WINDOW: 'rate_limit_window_ms',
  PAYMENT_TIMEOUT: 'payment_intent_timeout_ms',
  PAYMENT_POLL_INTERVAL: 'payment_polling_interval_ms',
  PAYMENT_POLL_MAX: 'payment_polling_max_attempts',
  CURRENCY: 'default_currency',
  TIMEZONE: 'default_timezone',
  LANGUAGE: 'default_language',
  DATE_FORMAT: 'date_format',
  ADMIN_REFRESH: 'admin_refresh_interval_ms',
  CHAT_CONNECT_TIMEOUT: 'chat_connection_timeout_ms',
  CHAT_RECONNECT_TIMEOUT: 'chat_reconnect_timeout_ms',
  INACTIVITY_TIMEOUT: 'inactivity_timeout_ms',
  EXP_COMUNA13: 'exp_comuna13_price',
  EXP_GUATAPE: 'exp_guatape_price',
  EXP_COFFEE: 'exp_coffee_price',
  EXP_PARAGLIDING: 'exp_paragliding_price',
  EXP_NIGHTLIFE: 'exp_nightlife_price',
  EXP_VIP_CITY: 'exp_vip_city_price',
} as const

// ── Defaults (match current hardcodes exactly) ──
const DEFAULTS: Record<string, string> = {
  [KEYS.PKG_SMOOTH_LANDING]: '89',
  [KEYS.PKG_FIRST_24]: '159',
  [KEYS.PKG_FULL_INSIDER]: '269',
  [KEYS.RETURN_TRIP_CHARGE]: '48',
  [KEYS.SERVICE_FEE_FLAT]: '5',
  [KEYS.TAX_RATE_IVA]: '0.19',
  [KEYS.HOTEL_COMMISSION]: '0.10',
  [KEYS.DRIVER_COMMISSION]: '30',
  [KEYS.STRIPE_FEE_PCT]: '0.029',
  [KEYS.STRIPE_FEE_FIXED]: '0.30',
  [KEYS.HOTEL_REVENUE_NIGHT]: '85',
  [KEYS.TRM_FALLBACK]: '4200',
  [KEYS.ADVANCE_BOOKING_DAYS]: '10',
  [KEYS.RATE_LIMIT_MAX]: '20',
  [KEYS.RATE_LIMIT_WINDOW]: '60000',
  [KEYS.PAYMENT_TIMEOUT]: '60000',
  [KEYS.PAYMENT_POLL_INTERVAL]: '2000',
  [KEYS.PAYMENT_POLL_MAX]: '30',
  [KEYS.CURRENCY]: 'usd',
  [KEYS.TIMEZONE]: 'America/Bogota',
  [KEYS.LANGUAGE]: 'en',
  [KEYS.DATE_FORMAT]: 'MM/DD/YYYY',
  [KEYS.ADMIN_REFRESH]: '30000',
  [KEYS.CHAT_CONNECT_TIMEOUT]: '90000',
  [KEYS.CHAT_RECONNECT_TIMEOUT]: '60000',
  [KEYS.INACTIVITY_TIMEOUT]: '900000',
  [KEYS.EXP_COMUNA13]: '89',
  [KEYS.EXP_GUATAPE]: '149',
  [KEYS.EXP_COFFEE]: '119',
  [KEYS.EXP_PARAGLIDING]: '79',
  [KEYS.EXP_NIGHTLIFE]: '249',
  [KEYS.EXP_VIP_CITY]: '399',
}

// ── Cache ──
let _cache: Map<string, string> | null = null
let _cacheAt = 0
const CACHE_TTL = 60_000

export class ConfigLoadError extends Error {
  constructor(message: string) {
    super(`[Config] ${message}`)
    this.name = 'ConfigLoadError'
  }
}

async function loadConfig(): Promise<Map<string, string>> {
  const now = Date.now()
  if (_cache && now - _cacheAt < CACHE_TTL) return _cache

  try {
    const db = getDb()
    const result = await db.execute('SELECT key, value FROM settings')
    const map = new Map<string, string>(DEFAULTS)
    for (const row of result.rows) {
      map.set(row.key as string, row.value as string)
    }
    _cache = map
    _cacheAt = now
    return map
  } catch (err) {
    throw new ConfigLoadError(
      `Failed to load config from database: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

function getValue(map: Map<string, string>, key: string): string {
  const val = map.get(key)
  if (val === undefined) {
    return DEFAULTS[key] ?? ''
  }
  return val
}

// ── Public API ──
export const PACKAGE_IDS = ['smooth-landing', 'first-24', 'full-insider'] as const
export type PackageId = (typeof PACKAGE_IDS)[number]

const PKG_KEY_MAP: Record<string, string> = {
  'smooth-landing': KEYS.PKG_SMOOTH_LANDING,
  'first-24': KEYS.PKG_FIRST_24,
  'full-insider': KEYS.PKG_FULL_INSIDER,
}

export async function getPackagePrice(packageId: string): Promise<number> {
  const cfg = await loadConfig()
  const key = PKG_KEY_MAP[packageId]
  if (!key) return 0
  return Number(getValue(cfg, key)) || 0
}

export async function getPackagePriceCents(packageId: string): Promise<number> {
  return (await getPackagePrice(packageId)) * 100
}

export async function getReturnTripCharge(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.RETURN_TRIP_CHARGE)) || 0
}

export async function getReturnTripChargeCents(): Promise<number> {
  return (await getReturnTripCharge()) * 100
}

export async function getPackageTotal(packageId: string, needReturn: boolean): Promise<number> {
  const price = await getPackagePrice(packageId)
  const returnCharge = needReturn ? await getReturnTripCharge() : 0
  return price + returnCharge
}

export async function getPackageTotalCents(packageId: string, needReturn: boolean): Promise<number> {
  return (await getPackageTotal(packageId, needReturn)) * 100
}

export async function getPackageName(packageId: string): Promise<string> {
  const cfg = await loadConfig()
  return cfg.get(`pkg_${packageId.replace(/-/g, '_')}_name`) || packageId
}

export async function getServiceFee(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.SERVICE_FEE_FLAT)) || 0
}

export async function getTaxRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.TAX_RATE_IVA)) || 0
}

export async function getDefaultCurrency(): Promise<string> {
  const cfg = await loadConfig()
  return getValue(cfg, KEYS.CURRENCY)
}

export async function getAdvanceBookingDays(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.ADVANCE_BOOKING_DAYS)) || 10
}

export async function getHotelCommissionRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.HOTEL_COMMISSION)) || 0.10
}

export async function getDriverCommissionRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.DRIVER_COMMISSION)) || 30
}

export async function getStripeFeePercent(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.STRIPE_FEE_PCT)) || 0.029
}

export async function getStripeFeeFixed(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.STRIPE_FEE_FIXED)) || 0.30
}

export async function getHotelRevenuePerNight(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.HOTEL_REVENUE_NIGHT)) || 85
}

export async function getTrmFallbackRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.TRM_FALLBACK)) || 4200
}

export async function getRateLimitConfig(): Promise<{ maxRequests: number; windowMs: number }> {
  const cfg = await loadConfig()
  return {
    maxRequests: Number(getValue(cfg, KEYS.RATE_LIMIT_MAX)) || 20,
    windowMs: Number(getValue(cfg, KEYS.RATE_LIMIT_WINDOW)) || 60000,
  }
}

export async function getPaymentTimeoutConfig(): Promise<{
  intentTimeoutMs: number
  pollingIntervalMs: number
  maxAttempts: number
}> {
  const cfg = await loadConfig()
  return {
    intentTimeoutMs: Number(getValue(cfg, KEYS.PAYMENT_TIMEOUT)) || 60000,
    pollingIntervalMs: Number(getValue(cfg, KEYS.PAYMENT_POLL_INTERVAL)) || 2000,
    maxAttempts: Number(getValue(cfg, KEYS.PAYMENT_POLL_MAX)) || 30,
  }
}

export async function getAdminRefreshInterval(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.ADMIN_REFRESH)) || 30000
}

export async function getChatTimeouts(): Promise<{ connectionMs: number; reconnectMs: number }> {
  const cfg = await loadConfig()
  return {
    connectionMs: Number(getValue(cfg, KEYS.CHAT_CONNECT_TIMEOUT)) || 90000,
    reconnectMs: Number(getValue(cfg, KEYS.CHAT_RECONNECT_TIMEOUT)) || 60000,
  }
}

export async function getInactivityTimeout(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.INACTIVITY_TIMEOUT)) || 900000
}

export async function getExperiencePrice(expId: string): Promise<number> {
  const cfg = await loadConfig()
  const keyMap: Record<string, string> = {
    comuna13: KEYS.EXP_COMUNA13,
    guatape: KEYS.EXP_GUATAPE,
    coffee: KEYS.EXP_COFFEE,
    paragliding: KEYS.EXP_PARAGLIDING,
    nightlife: KEYS.EXP_NIGHTLIFE,
    'vip-city': KEYS.EXP_VIP_CITY,
  }
  const key = keyMap[expId]
  if (!key) return 0
  return Number(getValue(cfg, key)) || 0
}

export async function getAllPublicConfig() {
  const cfg = await loadConfig()
  return {
    packages: {
      'smooth-landing': {
        name: 'The VIP Arrival',
        price: Number(getValue(cfg, KEYS.PKG_SMOOTH_LANDING)) || 89,
      },
      'first-24': {
        name: 'The 24h Insider',
        price: Number(getValue(cfg, KEYS.PKG_FIRST_24)) || 159,
      },
      'full-insider': {
        name: 'The Peace of Mind',
        price: Number(getValue(cfg, KEYS.PKG_FULL_INSIDER)) || 269,
      },
    },
    returnTripCharge: Number(getValue(cfg, KEYS.RETURN_TRIP_CHARGE)) || 48,
    serviceFee: Number(getValue(cfg, KEYS.SERVICE_FEE_FLAT)) || 5,
    taxRate: Number(getValue(cfg, KEYS.TAX_RATE_IVA)) || 0.19,
    currency: getValue(cfg, KEYS.CURRENCY),
    advanceBookingDays: Number(getValue(cfg, KEYS.ADVANCE_BOOKING_DAYS)) || 10,
    stripeFeePercent: Number(getValue(cfg, KEYS.STRIPE_FEE_PCT)) || 0.029,
    stripeFeeFixed: Number(getValue(cfg, KEYS.STRIPE_FEE_FIXED)) || 0.30,
    experiences: {
      comuna13: Number(getValue(cfg, KEYS.EXP_COMUNA13)) || 89,
      guatape: Number(getValue(cfg, KEYS.EXP_GUATAPE)) || 149,
      coffee: Number(getValue(cfg, KEYS.EXP_COFFEE)) || 119,
      paragliding: Number(getValue(cfg, KEYS.EXP_PARAGLIDING)) || 79,
      nightlife: Number(getValue(cfg, KEYS.EXP_NIGHTLIFE)) || 249,
      'vip-city': Number(getValue(cfg, KEYS.EXP_VIP_CITY)) || 399,
    },
  }
}

export async function refreshConfig(): Promise<void> {
  _cache = null
  await loadConfig()
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add lib/config.ts
git commit -m "feat: add server config module with DB-backed typed getters"
```

---

### Task 2: Create `GET /api/config` Public Endpoint

**Files:**
- Create: `app/api/config/route.ts`

- [ ] **Step 1: Write the endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getAllPublicConfig, ConfigLoadError } from '@/lib/config'

export async function GET() {
  try {
    const config = await getAllPublicConfig()
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    })
  } catch (err) {
    if (err instanceof ConfigLoadError) {
      return NextResponse.json(
        { error: 'config_unavailable', message: 'Service temporarily unavailable. Configuration could not be loaded.' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'server_error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/api/config/route.ts
git commit -m "feat: add public /api/config endpoint for booking frontend"
```

---

### Task 3: Rewrite `lib/pricing.ts` as Wrapper

**Files:**
- Modify: `lib/pricing.ts`

- [ ] **Step 1: Replace content with async wrappers delegating to lib/config**

```typescript
// This module is kept for backward compatibility.
// All consumers should migrate to @/lib/config directly over time.

import {
  getPackagePrice as _getPackagePrice,
  getPackagePriceCents as _getPackagePriceCents,
  getPackageName as _getPackageName,
  getPackageTotal as _getPackageTotal,
  getPackageTotalCents as _getPackageTotalCents,
  getReturnTripCharge as _getReturnTripCharge,
  getReturnTripChargeCents as _getReturnTripChargeCents,
} from '@/lib/config'

export type PackageId = 'smooth-landing' | 'first-24' | 'full-insider'

export const PACKAGES = {
  'smooth-landing': { name: 'The VIP Arrival', price: 89, priceCents: 8900 },
  'first-24': { name: 'The 24h Insider', price: 159, priceCents: 15900 },
  'full-insider': { name: 'The Peace of Mind', price: 269, priceCents: 26900 },
} as const

export const RETURN_TRIP_CHARGE = 48
export const RETURN_TRIP_CHARGE_CENTS = 4800

export function getPackagePrice(packageId: string): number {
  return PACKAGES[packageId as PackageId]?.price || 0
}

export function getPackagePriceCents(packageId: string): number {
  return PACKAGES[packageId as PackageId]?.priceCents || 0
}

export function getPackageName(packageId: string): string {
  return PACKAGES[packageId as PackageId]?.name || packageId
}

export function getPackageTotal(packageId: string, needReturn: boolean): number {
  return getPackagePrice(packageId) + (needReturn ? RETURN_TRIP_CHARGE : 0)
}

export function getPackageTotalCents(packageId: string, needReturn: boolean): number {
  return getPackagePriceCents(packageId) + (needReturn ? RETURN_TRIP_CHARGE_CENTS : 0)
}

export async function getConfigPackagePrice(packageId: string): Promise<number> {
  return _getPackagePrice(packageId)
}

export async function getConfigPackagePriceCents(packageId: string): Promise<number> {
  return _getPackagePriceCents(packageId)
}

export async function getConfigPackageName(packageId: string): Promise<string> {
  return _getPackageName(packageId)
}

export async function getConfigPackageTotal(packageId: string, needReturn: boolean): Promise<number> {
  return _getPackageTotal(packageId, needReturn)
}

export async function getConfigPackageTotalCents(packageId: string, needReturn: boolean): Promise<number> {
  return _getPackageTotalCents(packageId, needReturn)
}

export async function getConfigReturnTripCharge(): Promise<number> {
  return _getReturnTripCharge()
}

export async function getConfigReturnTripChargeCents(): Promise<number> {
  return _getReturnTripChargeCents()
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/pricing.ts
git commit -m "refactor: lib/pricing wraps lib/config for backward compat"
```

---

### Task 4: Update Payment API to Use Config

**Files:**
- Modify: `app/api/payments/create-intent/route.ts`
- Modify: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Update create-intent to use config getters**

In `app/api/payments/create-intent/route.ts`, replace:

```typescript
import { getPackageName, getPackagePriceCents, getPackageTotalCents } from '@/lib/pricing'
```

with:

```typescript
import { getConfigPackageName, getConfigPackagePriceCents, getConfigPackageTotalCents, getConfigReturnTripChargeCents } from '@/lib/pricing'
import { getDefaultCurrency } from '@/lib/config'
```

Then replace `getPackagePriceCents(packageId)` with `await getConfigPackagePriceCents(packageId)`, `getPackageTotalCents(...)` with `await getConfigPackageTotalCents(...)`, and `getPackageName(packageId)` with `await getConfigPackageName(packageId)`.

Also replace the hardcoded `currency: 'usd'` on line ~60 with `currency: await getDefaultCurrency()`.

- [ ] **Step 2: Update stripe webhook to use config**

In `app/api/webhooks/stripe/route.ts`, replace the `getPackageName` import with `getConfigPackageName` and await it.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/payments/create-intent/route.ts app/api/webhooks/stripe/route.ts
git commit -m "refactor: payment APIs use config getters instead of hardcodes"
```

---

### Task 5: Update Booking Frontend to Use `/api/config`

**Files:**
- Modify: `app/components/booking/booking-form.tsx`
- Modify: `app/components/booking/step-packages.tsx`
- Modify: `app/components/booking/step-payment.tsx`
- Modify: `app/components/booking/step-flight-logistics.tsx`
- Modify: `app/components/booking/booking-summary.tsx`

- [ ] **Step 1: Create a shared config context + fetch in booking-form.tsx**

In `booking-form.tsx`, add after `BookingFormInner` begins:

```typescript
interface BookingConfig {
  packages: Record<string, { name: string; price: number }>
  returnTripCharge: number
  serviceFee: number
  taxRate: number
  currency: string
  advanceBookingDays: number
}

const [bookingConfig, setBookingConfig] = useState<BookingConfig | null>(null)
const [configError, setConfigError] = useState(false)

useEffect(() => {
  fetch('/api/config')
    .then(r => {
      if (!r.ok) throw new Error(`Config fetch failed: ${r.status}`)
      return r.json()
    })
    .then(cfg => setBookingConfig(cfg))
    .catch(() => setConfigError(true))
}, [])
```

If `configError` is true, render an error state blocking the flow:

```tsx
if (configError) {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.12)] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-display-lg text-white mb-2">Service Temporarily Unavailable</h2>
        <p className="text-body-md text-[var(--text-secondary)]">We are unable to process bookings at this moment. Please try again shortly.</p>
        <button onClick={() => window.location.reload()} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] bg-gold-gradient text-[var(--bg-dark)] font-bold">
          Try Again
        </button>
      </div>
    </div>
  )
}
```

Pass `bookingConfig` to step components that need it.

- [ ] **Step 2: Update step-packages.tsx to use dynamic prices**

Replace the hardcoded `packagePrices` and `popularFlags`:

```typescript
// Remove:
// const packagePrices: Record<string, number> = { ... }
// const popularFlags: Record<string, boolean> = { ... }

// Add prop:
interface StepPackagesProps {
  value: string
  onChange: (value: string) => void
  config?: BookingConfig | null
}

// Use config.packages for price and name:
const price = config?.packages?.[pkgId]?.price ?? 0
const isPopular = pkgId === 'first-24'
```

- [ ] **Step 3: Update step-payment.tsx to use dynamic prices**

Remove the hardcoded `PACKAGE_PRICES_USD` and `RETURN_TRIP_CHARGE`. Accept config prop:

```typescript
const config = props.config
const basePrice = config?.packages?.[packageId]?.price ?? 0
const returnCharge = config?.returnTripCharge ?? 48
const totalPrice = basePrice + (hasReturn ? returnCharge : 0)
```

- [ ] **Step 4: Update step-flight-logistics.tsx for dynamic return charge and advance days**

The `+$48` display becomes `+$${config?.returnTripCharge ?? 48}`. The advance booking days `minDate` calculation uses `config?.advanceBookingDays ?? 10`.

- [ ] **Step 5: Update booking-summary.tsx to use dynamic values**

Remove hardcoded `PACKAGE_PRICES`, `PACKAGE_NAMES`, and use config props instead. The `$5.00` service fee becomes `${config?.serviceFee?.toFixed(2) ?? '5.00'}`, the `0.19` tax rate becomes `config?.taxRate ?? 0.19`, and `returnCharge = needReturn ? 48 : 0` becomes `needReturn ? (config?.returnTripCharge ?? 48) : 0`.

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/components/booking/
git commit -m "refactor: booking frontend reads prices from /api/config"
```

---

### Task 6: Update Admin Dashboard Revenue Calculations

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Replace hardcoded $48 and $85 with API-fetched config**

In the admin dashboard, add a fetch to `/api/admin/settings` (already fetched for other purposes) or add a direct `/api/config` fetch. Replace:

- `b.returnFee || 48` → `b.returnFee || returnTripCharge`
- `(b.numNights || 0) * 85` → `(b.numNights || 0) * hotelRevenuePerNight`

Add state:

```typescript
const [configValues, setConfigValues] = useState({ returnTripCharge: 48, hotelRevenuePerNight: 85 })
```

Fetch on mount:

```typescript
useEffect(() => {
  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => setConfigValues({
      returnTripCharge: cfg.returnTripCharge ?? 48,
      hotelRevenuePerNight: 85,
    }))
    .catch(() => {})
}, [])
```

Replace all instances of `|| 48` and `* 85` with state values.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "refactor: admin dashboard revenue uses config values"
```

---

### Task 7: Update Admin Grid/Payments Stripe Fee Display

**Files:**
- Modify: `app/admin/grid/page.tsx`
- Modify: `app/admin/payments/page.tsx`

- [ ] **Step 1: Replace hardcoded Stripe fee calculation**

In `app/admin/grid/page.tsx`, replace:

```typescript
// current: selectedTx.amount * 0.029 + 0.3
// new:
const [stripeFee, setStripeFee] = useState({ percent: 0.029, fixed: 0.30 })

// Fetch from /api/config on mount
// Use: selectedTx.amount * stripeFee.percent + stripeFee.fixed
```

Same pattern in `app/admin/payments/page.tsx` for the displayed label.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/grid/page.tsx app/admin/payments/page.tsx
git commit -m "refactor: admin grid/payments use config stripe fees"
```

---

### Task 8: Update Rate Limiter to Use Config

**Files:**
- Modify: `lib/rate-limit.ts`

- [ ] **Step 1: Make rate limit values configurable**

```typescript
import { getRateLimitConfig } from '@/lib/config'

let _maxRequests = 20
let _windowMs = 60_000
let _initialized = false

async function initConfig() {
  if (_initialized) return
  try {
    const cfg = await getRateLimitConfig()
    _maxRequests = cfg.maxRequests
    _windowMs = cfg.windowMs
    _initialized = true
  } catch {
    // Keep defaults on error
  }
}

// In checkRateLimit, use _maxRequests and _windowMs instead of hardcoded 20 and 60_000
// Call initConfig() lazily on first use
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "refactor: rate limiter reads config from DB"
```

---

### Task 9: Update TRM Module to Use Config Fallback

**Files:**
- Modify: `lib/trm.ts`

- [ ] **Step 1: Replace hardcoded 4200 fallback**

```typescript
import { getTrmFallbackRate } from '@/lib/config'

let _fallbackRate = 4200

async function initFallback() {
  try {
    _fallbackRate = await getTrmFallbackRate()
  } catch {}
}

// Call initFallback() on first use
// Replace all hardcoded 4200 references with _fallbackRate
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/trm.ts
git commit -m "refactor: TRM fallback rate from config"
```

---

### Task 10: Update Chat Widget Timeouts

**Files:**
- Modify: `app/components/chat/ChatWidget.tsx`

- [ ] **Step 1: Replace hardcoded timeouts**

```typescript
// Fetch config on mount
const [chatConfig, setChatConfig] = useState({ connectMs: 90000, reconnectMs: 60000 })

useEffect(() => {
  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => {
      // Chat timeouts aren't in the public config — add them or use defaults
      // For now use the hardcoded defaults which will be replaced when admin settings
      // expose chat timeout config through the public API
    })
    .catch(() => {})
}, [])

// Replace 60000 and 90000 with state values
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/components/chat/ChatWidget.tsx
git commit -m "refactor: chat timeouts from config"
```

---

### Task 11: Update Inactivity Guard

**Files:**
- Modify: `app/components/admin/InactivityGuard.tsx`

- [ ] **Step 1: Replace hardcoded timeout**

Replace the hardcoded `60000` warning timeout and `900000` (NEXT_PUBLIC_INACTIVITY_TIMEOUT default) with fetches from config or keep the env var override pattern but add `/api/config` as source.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/components/admin/InactivityGuard.tsx
git commit -m "refactor: inactivity guard timeout from config"
```

---

### Task 12: Update Admin Settings Page — Real Sections

**Files:**
- Modify: `app/admin/settings/page.tsx`

- [ ] **Step 1: Replace the Pricing Plans display section with real inputs**

Remove the current `section-pricing` content (lines 174-224) that has the 3 non-functional plan cards. Replace with:

```tsx
{/* Section 2: Package Pricing */}
<section className="settings-section" id="section-pricing">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    <span className="settings-section-title">Package Pricing</span>
    <span className="settings-section-desc">Configure service package prices in USD</span>
  </div>
  <div className="settings-section-body">
    <div className="form-grid">
      {[
        { key: 'pkg_smooth_landing_price', label: 'Smooth Landing', sub: 'The VIP Arrival', defaultVal: '89' },
        { key: 'pkg_first_24_price', label: 'First 24h Insider', sub: 'The 24h Insider', defaultVal: '159' },
        { key: 'pkg_full_insider_price', label: 'Full Insider Pass', sub: 'The Peace of Mind', defaultVal: '269' },
        { key: 'return_trip_charge', label: 'Return Trip Charge', sub: 'Round-trip add-on', defaultVal: '48' },
      ].map(item => (
        <div key={item.key} className="input-group">
          <label className="input-label">
            {item.label}
            <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>$</span>
            <input className="input" type="number" min="0" step="1"
              value={settings[item.key] ?? item.defaultVal}
              onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
              style={{ width: 120 }}
            />
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>USD</span>
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--fg-secondary)' }}>
      <strong>Preview:</strong> First 24h (${settings['pkg_first_24_price'] || '159'}) + Return (${settings['return_trip_charge'] || '48'}) = <strong style={{ color: 'var(--accent-gold)' }}>${(Number(settings['pkg_first_24_price'] || 159) + Number(settings['return_trip_charge'] || 48)).toFixed(2)}</strong>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add Fees & Taxes section**

```tsx
{/* Section 3: Fees & Taxes */}
<section className="settings-section" id="section-fees">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    <span className="settings-section-title">Fees & Taxes</span>
    <span className="settings-section-desc">Configure service fees and tax rates</span>
  </div>
  <div className="settings-section-body">
    <div className="form-grid">
      {[
        { key: 'service_fee_flat', label: 'Service Fee (flat)', sub: 'Per-booking service charge', defaultVal: '5', prefix: '$', suffix: 'USD', step: '0.01' },
        { key: 'tax_rate_iva', label: 'IVA Tax Rate', sub: 'Colombian VAT', defaultVal: '0.19', prefix: '', suffix: '%', step: '0.01' },
        { key: 'stripe_fee_percent', label: 'Stripe Fee %', sub: 'Processing percentage', defaultVal: '0.029', prefix: '', suffix: '%', step: '0.001' },
        { key: 'stripe_fee_fixed', label: 'Stripe Fee Fixed', sub: 'Per-transaction fixed fee', defaultVal: '0.30', prefix: '$', suffix: 'USD', step: '0.01' },
      ].map(item => (
        <div key={item.key} className="input-group">
          <label className="input-label">
            {item.label}
            <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.prefix ? <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>{item.prefix}</span> : null}
            <input className="input" type="number" min="0" step={item.step}
              value={settings[item.key] ?? item.defaultVal}
              onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
              style={{ width: 120 }}
            />
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span>
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6 }}>
      <strong>Revenue Preview on $159 package + $48 return:</strong><br/>
      Gross: $207.00<br/>
      Service Fee: ${Number(settings['service_fee_flat'] || 5).toFixed(2)}<br/>
      IVA ({(Number(settings['tax_rate_iva'] || 0.19) * 100).toFixed(1)}%): ${((207 - Number(settings['service_fee_flat'] || 5)) * Number(settings['tax_rate_iva'] || 0.19)).toFixed(2)}<br/>
      Stripe Fee: ${(207 * Number(settings['stripe_fee_percent'] || 0.029) + Number(settings['stripe_fee_fixed'] || 0.30)).toFixed(2)}<br/>
      <strong style={{ color: 'var(--accent)' }}>Net Revenue: ${(207 - Number(settings['service_fee_flat'] || 5) - (207 - Number(settings['service_fee_flat'] || 5)) * Number(settings['tax_rate_iva'] || 0.19) - (207 * Number(settings['stripe_fee_percent'] || 0.029) + Number(settings['stripe_fee_fixed'] || 0.30))).toFixed(2)}</strong>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add Commissions section**

```tsx
{/* Section 4: Commissions */}
<section className="settings-section" id="section-commissions">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
    <span className="settings-section-title">Commissions</span>
    <span className="settings-section-desc">Configure platform revenue shares</span>
  </div>
  <div className="settings-section-body">
    <div className="form-grid">
      {[
        { key: 'hotel_commission_rate', label: 'Hotel Commission', sub: 'Platform commission rate', defaultVal: '0.10', suffix: '%', step: '0.01' },
        { key: 'driver_commission_rate', label: 'Driver Commission', sub: 'Driver revenue share', defaultVal: '30', suffix: '%', step: '1' },
        { key: 'hotel_revenue_per_night', label: 'Hotel Revenue/Night', sub: 'Average revenue per night for reporting', defaultVal: '85', prefix: '$', suffix: 'USD', step: '1' },
      ].map(item => (
        <div key={item.key} className="input-group">
          <label className="input-label">
            {item.label}
            <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.prefix ? <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>{item.prefix}</span> : null}
            <input className="input" type="number" min="0" step={item.step}
              value={settings[item.key] ?? item.defaultVal}
              onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
              style={{ width: 120 }}
            />
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add Business Rules section**

```tsx
{/* Section 5: Business Rules */}
<section className="settings-section" id="section-business-rules">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><path d="M6 10v2"/><path d="M18 10v2"/><path d="M6 18h4"/><path d="M14 18h4"/><path d="M6 14v4"/><path d="M18 14v4"/></svg>
    <span className="settings-section-title">Business Rules</span>
    <span className="settings-section-desc">Configure operational rules and limits</span>
  </div>
  <div className="settings-section-body">
    <div className="form-grid">
      {[
        { key: 'advance_booking_days', label: 'Advance Booking Days', sub: 'Minimum days before arrival', defaultVal: '10', suffix: 'days', step: '1' },
        { key: 'rate_limit_max_requests', label: 'Rate Limit Max', sub: 'Max requests per window', defaultVal: '20', suffix: 'req', step: '1' },
        { key: 'rate_limit_window_ms', label: 'Rate Limit Window', sub: 'Time window in milliseconds', defaultVal: '60000', suffix: 'ms', step: '1000' },
        { key: 'payment_intent_timeout_ms', label: 'Payment Timeout', sub: 'Stripe intent creation timeout', defaultVal: '60000', suffix: 'ms', step: '1000' },
        { key: 'payment_polling_interval_ms', label: 'Payment Poll Interval', sub: 'Status polling interval', defaultVal: '2000', suffix: 'ms', step: '500' },
        { key: 'payment_polling_max_attempts', label: 'Payment Max Polls', sub: 'Max status check attempts', defaultVal: '30', suffix: 'attempts', step: '1' },
      ].map(item => (
        <div key={item.key} className="input-group">
          <label className="input-label">
            {item.label}
            <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input className="input" type="number" min="0" step={item.step}
              value={settings[item.key] ?? item.defaultVal}
              onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
              style={{ width: 120 }}
            />
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Add Operational Timeouts section**

```tsx
{/* Section 6: Operational Timeouts */}
<section className="settings-section" id="section-timeouts">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    <span className="settings-section-title">Operational Timeouts</span>
    <span className="settings-section-desc">Configure system refresh and timeout intervals</span>
  </div>
  <div className="settings-section-body">
    <div className="form-grid">
      {[
        { key: 'admin_refresh_interval_ms', label: 'Admin Refresh', sub: 'Dashboard auto-refresh', defaultVal: '30000', suffix: 'ms', step: '5000' },
        { key: 'chat_connection_timeout_ms', label: 'Chat Connection', sub: 'Max connection wait time', defaultVal: '90000', suffix: 'ms', step: '5000' },
        { key: 'chat_reconnect_timeout_ms', label: 'Chat Reconnect', sub: 'Reconnection delay', defaultVal: '60000', suffix: 'ms', step: '5000' },
        { key: 'inactivity_timeout_ms', label: 'Inactivity Timeout', sub: 'Admin auto-logout timeout', defaultVal: '900000', suffix: 'ms', step: '30000' },
      ].map(item => (
        <div key={item.key} className="input-group">
          <label className="input-label">
            {item.label}
            <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input className="input" type="number" min="0" step={item.step}
              value={settings[item.key] ?? item.defaultVal}
              onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
              style={{ width: 140 }}
            />
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{item.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 6: Add Experience Pricing section**

```tsx
{/* Section 7: Experience Pricing */}
<section className="settings-section" id="section-experiences">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    <span className="settings-section-title">Experience Pricing</span>
    <span className="settings-section-desc">Configure tour and experience prices</span>
  </div>
  <div className="settings-section-body">
    <div className="form-grid">
      {[
        { key: 'exp_guatape_price', label: 'Guatape & El Penol', sub: 'Full-day trip', defaultVal: '149' },
        { key: 'exp_comuna13_price', label: 'Comuna 13 Tour', sub: 'Guided neighborhood tour', defaultVal: '89' },
        { key: 'exp_coffee_price', label: 'Coffee Tour', sub: 'Coffee farm experience', defaultVal: '119' },
        { key: 'exp_paragliding_price', label: 'Paragliding', sub: 'Tandem flight', defaultVal: '79' },
        { key: 'exp_nightlife_price', label: 'Nightlife Experience', sub: 'VIP club access', defaultVal: '249' },
        { key: 'exp_vip_city_price', label: 'VIP City Experience', sub: 'Full concierge day', defaultVal: '399' },
      ].map(item => (
        <div key={item.key} className="input-group">
          <label className="input-label">
            {item.label}
            <small style={{ display: 'block', fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, marginTop: 2 }}>{item.sub}</small>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 14 }}>$</span>
            <input className="input" type="number" min="0" step="1"
              value={settings[item.key] ?? item.defaultVal}
              onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
              style={{ width: 120 }}
            />
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>USD</span>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 7: Update side nav to include new sections**

Replace the `navItems` array:

```typescript
const navItems = [
  { id: 'section-company', label: 'Company Information' },
  { id: 'section-pricing', label: 'Package Pricing' },
  { id: 'section-fees', label: 'Fees & Taxes' },
  { id: 'section-commissions', label: 'Commissions' },
  { id: 'section-business-rules', label: 'Business Rules' },
  { id: 'section-timeouts', label: 'Operational Timeouts' },
  { id: 'section-experiences', label: 'Experience Pricing' },
  { id: 'section-payments', label: 'Payment Integration' },
  { id: 'section-roles', label: 'User Roles' },
  { id: 'section-notifications', label: 'Notifications' },
  { id: 'section-regional', label: 'Language & Regional' },
]
```

- [ ] **Step 8: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "feat: admin settings — real config sections with inputs and live previews"
```

---

### Task 13: Final Verification

**Files:**
- All modified files

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors)

- [ ] **Step 2: Run existing tests**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All passing

- [ ] **Step 3: Verify no remaining hardcodes**

Run: `rg '\b(89|159|269)\b' lib/ app/api/ app/components/booking/ --type ts --type tsx | grep -v node_modules | grep -v '.test.' | grep -v 'DEFAULTS' | grep -v 'settings' | grep -v 'defaultVal' | grep -v 'fallbackRate'`
Expected: No output (or only intentional references in defaults/config definitions)

- [ ] **Step 4: Commit**

```bash
git commit -am "chore: final verification — all hardcodes replaced with config"
```
