# SOURCE_OF_TRUTH_MATRIX (Real — Digital Twin)

> Concept → the **single source of truth today**. The goal of this matrix: make duplication
> impossible to (re)introduce. If a concept has >1 source today, that is a defect to fix in 2C.
> No code changes.

| Concept | Single source TODAY | Status | Risk / action in 2C |
|---|---|---|---|
| Driver availability | `lib/dispatch/availability.ts` (reads `drivers`) | ✅ single | Keep in `domains/drivers` + `domains/dispatch` |
| Price / quote | `lib/pricing.ts` | ✅ single | Keep as `packages/config` or `domains/booking` pricing; **never** recompute in booking |
| Promotion | `promotions` table + `lib/pricing.ts` | ✅ single | Keep in `domains/hotels` |
| RBAC / permissions | `lib/admin/permissions.ts` + `modules`/`role_permissions` tables | ✅ single | Keep in `packages/auth` |
| Booking state | `orders_new` table | ✅ single | Keep in `domains/booking` repository |
| Customer record | `customers` table | ✅ single | Keep in `domains/customers` |
| Driver record | `drivers` table | ✅ single | Keep in `domains/drivers` |
| WhatsApp message outbox | `outgoing_messages` table | ✅ single (notify-only) | Promote to **generic outbox** in `packages/realtime` |
| Chat transcript | `conversations`/`messages` tables | ✅ single | Keep in `domains/chat` |
| Configuration (env) | `lib/config.ts` (`validateEnv`) | ⚠️ dual | Split: static env → `packages/config`; runtime config → `domains/settings` |
| Configuration (runtime) | `settings` table | ⚠️ dual | Single source = `domains/settings`; env only for bootstrapping |
| Trip state | **no single source** (embedded in `orders_new.additional_trips`, `assignments.service_type`, config `experiences`) | ❌ missing | Create `domains/trips` as the sole owner in 2C |
| Vehicle | **no single source** (columns on `drivers.vehicle`/`plate` + n8n payloads) | ❌ missing | Extract `domains/vehicles` in 2C |
| FX rate (TRM) | `lib/trm.ts` | ✅ single | Keep in `domains/booking` or `packages/config` |
| Rating | `ratings` table | ✅ single | Keep in `domains/ratings` |

## Rule (from Constitution §14 + Blueprint)
A concept must have **exactly one writer**. Today the clean ones (availability, price,
permissions, booking state) must stay single-sourced. The two defects — **Trip state** and
**Vehicle** — are exactly why the Blueprint introduces first-class `trips` and `vehicles`
domains. **Config** is dual today and must be split into static (`packages/config`) vs runtime
(`domains/settings`) before 2C touches settings.
