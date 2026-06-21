# Parametrizable Config — Design Spec

**Date:** 2026-06-21
**Scope:** All hardcoded values made configurable via admin panel, stored in DB

---

## 1. Overview

Replace all ~70 hardcoded values (prices, fees, tax rates, timeouts, commissions, limits) with a centralized DB-backed configuration system. The admin can change any value from the Settings page, and all parts of the application (booking funnel, payment gateway, admin dashboard, chat, rate limiter) consume the live values.

**Approach:** Extend the existing `settings` key-value table + create a typed server config module + public `/api/config` endpoint for the frontend.

---

## 2. Data Model

### 2.1 Settings Table (exists — `lib/db/migrations/019_settings_table.sql`)

```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);
```

No migration needed. All 32 new keys stored in the same table.

### 2.2 Settings Keys & Defaults

#### Package Pricing
| Key | Default | Type |
|-----|---------|------|
| `pkg_smooth_landing_price` | `89` | number USD |
| `pkg_first_24_price` | `159` | number USD |
| `pkg_full_insider_price` | `269` | number USD |
| `return_trip_charge` | `48` | number USD |
| `service_fee_flat` | `5` | number USD |
| `tax_rate_iva` | `0.19` | decimal (19%) |

#### Commissions & Fees
| Key | Default | Type |
|-----|---------|------|
| `hotel_commission_rate` | `0.10` | decimal |
| `driver_commission_rate` | `30` | number (%) |
| `stripe_fee_percent` | `0.029` | decimal |
| `stripe_fee_fixed` | `0.30` | decimal USD |
| `hotel_revenue_per_night` | `85` | number USD |
| `trm_fallback_rate` | `4200` | number COP |

#### Business Rules
| Key | Default | Type |
|-----|---------|------|
| `advance_booking_days` | `10` | number |
| `rate_limit_max_requests` | `20` | number |
| `rate_limit_window_ms` | `60000` | number ms |
| `payment_intent_timeout_ms` | `60000` | number ms |
| `payment_polling_interval_ms` | `2000` | number ms |
| `payment_polling_max_attempts` | `30` | number |

#### Currency & Region
| Key | Default | Type |
|-----|---------|------|
| `default_currency` | `usd` | string |
| `default_timezone` | `America/Bogota` | string |
| `default_language` | `en` | string |
| `date_format` | `MM/DD/YYYY` | string |

#### Operational
| Key | Default | Type |
|-----|---------|------|
| `admin_refresh_interval_ms` | `30000` | number ms |
| `chat_connection_timeout_ms` | `90000` | number ms |
| `chat_reconnect_timeout_ms` | `60000` | number ms |
| `inactivity_timeout_ms` | `900000` | number ms |

#### Experience Pricing
| Key | Default | Type |
|-----|---------|------|
| `exp_comuna13_price` | `89` | number USD |
| `exp_guatape_price` | `149` | number USD |
| `exp_coffee_price` | `119` | number USD |
| `exp_paragliding_price` | `79` | number USD |
| `exp_nightlife_price` | `249` | number USD |
| `exp_vip_city_price` | `399` | number USD |

**Total: 32 keys** covering all ~70 hardcoded values (many consolidate by sharing the same config source).

---

## 3. Server Config Module

### 3.1 `lib/config.ts` (NEW)

In-memory cache with DB fallback. Single source of truth for all config values.

```typescript
// Key exports:
getPackagePrice(packageId: string): number
getPackagePriceCents(packageId: string): number
getPackageTotal(packageId: string, needReturn: boolean): number
getPackageTotalCents(packageId: string, needReturn: boolean): number
getPackageName(packageId: string): string
getReturnTripCharge(): number
getReturnTripChargeCents(): number
getServiceFee(): number
getTaxRate(): number
getDefaultCurrency(): string
getAdvanceBookingDays(): number
getHotelCommissionRate(): number
getDriverCommissionRate(): number
getStripeFeePercent(): number
getStripeFeeFixed(): number
getHotelRevenuePerNight(): number
getTrmFallbackRate(): number
getRateLimitConfig(): { maxRequests: number; windowMs: number }
getPaymentTimeoutConfig(): { intentTimeoutMs: number; pollingIntervalMs: number; maxAttempts: number }
getAdminRefreshInterval(): number
getChatTimeouts(): { connectionMs: number; reconnectMs: number }
getInactivityTimeout(): number
getExperiencePrice(expId: string): number
getAllPublicConfig(): PublicConfig  // for /api/config
```

**Cache:** `Map<string, string>`, TTL 60 seconds. On miss, reloads from DB.
**Defaults:** Defined inline as a static object `SETTING_DEFAULTS`.
**Graceful:** If DB is unreachable, returns defaults. Never throws.

### 3.2 `lib/pricing.ts` (MODIFIED)

Becomes a thin wrapper that delegates to `lib/config.ts`. Backward compatible — all existing imports continue to work.

```typescript
import { getPackagePrice, getPackageName, ... } from '@/lib/config'
export { getPackagePrice, getPackageName, ... }
```

---

## 4. API Endpoints

### 4.1 `GET /api/config` (NEW — public)

Returns all values needed by the booking frontend. No auth required.

```json
{
  "packages": {
    "smooth-landing": { "name": "The VIP Arrival", "price": 89 },
    "first-24": { "name": "The 24h Insider", "price": 159 },
    "full-insider": { "name": "The Peace of Mind", "price": 269 }
  },
  "returnTripCharge": 48,
  "serviceFee": 5,
  "taxRate": 0.19,
  "currency": "usd",
  "advanceBookingDays": 10,
  "experiences": {
    "comuna13": 89, "guatape": 149, "coffee": 119,
    "paragliding": 79, "nightlife": 249, "vip-city": 399
  }
}
```

### 4.2 `GET/PUT /api/admin/settings` (EXISTS — no changes)

Already works. Admin reads all settings, saves modified ones. Protected by `requirePermission('settings', ...)`.

---

## 5. Admin UI

### 5.1 `app/admin/settings/page.tsx` (REWRITTEN)

**Side nav sections** (extend from current 7 to 11):

| # | Section ID | Content |
|---|-----------|---------|
| 1 | `section-company` | Company info (existing — unchanged) |
| 2 | `section-pricing` | Package prices, return charge |
| 3 | `section-fees` | Service fee, IVA, Stripe fees |
| 4 | `section-commissions` | Hotel %, driver %, hotel revenue/night |
| 5 | `section-business-rules` | Advance days, rate limits |
| 6 | `section-timeouts` | Payment timeouts, chat timeouts, refresh intervals |
| 7 | `section-experiences` | Experience/tour pricing |
| 8 | `section-payments` | Stripe integration (existing — improved) |
| 9 | `section-roles` | Roles & permissions (existing — unchanged) |
| 10 | `section-notifications` | Notification settings (existing — unchanged) |
| 11 | `section-regional` | Currency, timezone, language, date format (existing — improved) |

**Each section pattern:**
- Section header with title + description
- Form inputs bound to `settings[key]` state
- Live preview of calculations (where applicable)
- Visual validation (red border on invalid input)

**Save behavior:**
- Single "Save All Settings" button at the bottom (existing pattern)
- PUT to `/api/admin/settings` with entire settings object

### 5.2 Section specific designs

**Package Pricing:**
```
┌──────────────────────────────────────────┐
│ 📦 Package Pricing                       │
│ Configure service package prices         │
├──────────────────────────────────────────┤
│ Smooth Landing Price  [$89   ]  USD      │
│ First 24h Insider     [$159  ]  USD      │
│ Full Insider Pass     [$269  ]  USD      │
│ Return Trip Charge    [$48   ]  USD      │
│                                          │
│ ⓘ Preview: First 24 ($159) + Return     │
│   ($48) = Total $207.00                  │
└──────────────────────────────────────────┘
```

**Fees & Taxes:**
```
┌──────────────────────────────────────────┐
│ 💰 Fees & Taxes                          │
├──────────────────────────────────────────┤
│ Service Fee (flat)    [$5.00  ]  USD     │
│ IVA Tax Rate          [0.19   ]  (19%)   │
│ Stripe Fee %          [0.029  ]  (2.9%)  │
│ Stripe Fee Fixed      [$0.30  ]  USD     │
│                                          │
│ ⓘ Revenue preview on $159 package + $48  │
│   return:                                │
│   Gross: $207.00                         │
│   Service Fee: $5.00                     │
│   IVA (19%): $39.33                      │
│   Stripe: ~$6.30                         │
│   Net Revenue: ~$156.37                  │
└──────────────────────────────────────────┘
```

---

## 6. Data Flow

```
Admin saves settings → settings table (DB)
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
      lib/config.ts            GET /api/config
      (server-side,            (public endpoint,
       direct DB read)          cached, JSON)
              │                       │
              ▼                       ▼
      /api/payments/           BookingForm    
      create-intent            (fetch on mount,
      (amount in cents)        display prices,
                               calculate totals,
                               sidebar summary)
```

### Booking flow:

1. `BookingForm` mounts → fetches `GET /api/config`
2. Stores config in React state/context
3. All step components read from config context (no hardcodes)
4. Sidebar summary uses real-time values
5. Payment intent uses server-side `lib/config.ts` (cannot trust client)

### Fallback behavior:
- If `/api/config` fails → show hardcoded defaults (exactly what exists today)
- If DB has no settings → defaults apply
- Admin can reset any value to default by clearing the field

---

## 7. File Impact

| File | Action | Description |
|------|--------|-------------|
| `lib/config.ts` | NEW | Server config module with typed getters |
| `app/api/config/route.ts` | NEW | Public GET endpoint for frontend |
| `lib/pricing.ts` | MODIFY | Wrapper delegating to lib/config |
| `app/admin/settings/page.tsx` | REWRITE | Real sections with inputs |
| `app/components/booking/booking-summary.tsx` | MODIFY | Use /api/config values |
| `app/components/booking/step-packages.tsx` | MODIFY | Dynamic prices from config |
| `app/components/booking/step-payment.tsx` | MODIFY | Dynamic prices from config |
| `app/components/booking/step-flight-logistics.tsx` | MODIFY | Return charge, advance days |
| `app/components/booking/booking-form.tsx` | MODIFY | Fetch config on mount |
| `app/admin/page.tsx` | MODIFY | Revenue calc from config |
| `app/admin/grid/page.tsx` | MODIFY | Stripe fee from config |
| `lib/rate-limit.ts` | MODIFY | Values from config |
| `lib/trm.ts` | MODIFY | Fallback from config |
| `app/components/chat/ChatWidget.tsx` | MODIFY | Timeouts from config |
| `app/components/admin/InactivityGuard.tsx` | MODIFY | Timeout from config |

---

## 8. Testing

- **Unit tests for `lib/config.ts`:** Verify defaults returned when DB empty, DB values override defaults, cache TTL works, all getters return correct types
- **Integration test for `/api/config`:** Verify public endpoint returns all needed keys, no auth required
- **Manual admin flow:** Save values in Settings → Verify booking page reflects changes → Verify payment intent uses correct amounts
- **Backward compat:** Old `lib/pricing.ts` imports still work identically

---

## 9. Rollout Strategy

1. Create `lib/config.ts` with defaults matching current hardcodes
2. Create `/api/config` endpoint
3. Rewrite admin settings page
4. Update booking components one by one, replacing hardcodes with config
5. Update server-side consumers (payment API, admin dashboard)
6. Remove old hardcodes and duplicate constants

Each step is independently testable and deployable.
