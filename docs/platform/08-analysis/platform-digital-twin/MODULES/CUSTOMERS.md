# Customers (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `app/api/admin/customers/route.ts`
  - **Responsibilities (real):** ✔ `GET` calls `syncCustomersFromOrders(db)` (one-time seed: if `customers` table empty, backfills from distinct `orders.customer_email` with derived `total_trips`, `lifetime_value`, first/last trip dates). ✔ `GET` supports filters `search`/`status`/`vip` and returns a KPI aggregate (`total`/`active`/`inactive`/`new_month`/`vip`/`total_trips`/`total_ltv`). ✔ `POST` creates a customer (requires `name`+`email`); `PUT` uses `buildSafeUpdate` over `ALLOWED_CUSTOMER_COLUMNS` (11 cols); `DELETE` is soft-delete (`status='inactive'`). ✔ All verbs guarded by `requirePermission('customers', <verb>)`. ✔ Exports a `Customer` TS type.
  - **Problem (real):** Customer data is a denormalized projection of `orders` maintained by a one-shot sync — no ongoing sync mechanism, so `lifetime_value`/`total_trips` go stale after seed. KPI query recomputes aggregates on every GET. No repository layer; raw SQL in route.

- **File:** `app/admin/customers/page.tsx`
  - **Responsibilities (real):** ✔ Admin UI: fetches `/api/admin/customers?search&status&vip_level`; renders KPI row (references `returning_rate`, `avg_ltv`, `nps` fields that the API does NOT return — they display as `—`); table with VIP/status badges; CSV export (`exportCsv`); slide-in detail panel with tabs (`profile`/`reservations`/`preferences`/`support`/`tags`). ✔ `reservations`/`preferences`/`support` tabs render static "no data" placeholders. ✔ Add/edit modal.
  - **Problem (real):** KPI cards `returning_rate`, `nps` are requested from API KPIs that don't exist → always `—` (dead UI contract). Detail tabs `preferences`/`support`/`reservations` are non-functional stubs. Customer↔orders relationship is surfaced only via the stale aggregate, not a real join in the UI.

- **File:** `lib/services/payment-service.ts` (indirect customer reference)
  - **Responsibilities (real):** ✔ Reads/writes `payment_records` with `customer_email`/`customer_name`/`customer_phone` columns; maps payment rows to a record shape.
  - **Problem (real):** Customer identity is tracked per-payment by email string, not by FK to the `customers` table — customer is a string attribute scattered across `orders` and `payment_records`, not a first-class linked entity.

- **File:** `lib/payment-record.ts` (indirect customer reference)
  - **Responsibilities (real):** ✔ Declares the `PaymentRecord` interface including `customer_email`/`customer_name`/`customer_phone`.
  - **Problem (real):** Reinforces the email-as-customer-key pattern rather than an ID reference.

## Module-level real responsibilities
- ✔ Customer CRUD (admin) with soft-delete and column allowlist.
- ✔ One-time backfill of customers from historical orders (seed only).
- ✔ KPI aggregation (active/inactive/new/vip/trips/LTV) computed on read.
- ✔ Customer attributes referenced across `orders` and `payment_records` by email (no FK).

## Proposed split (target per Blueprint domains/packages)
- `packages/domains/customers` — `CustomerService`, `CustomerRepository`, `CustomerValidator` (replace `ALLOWED_CUSTOMER_COLUMNS`).
- `packages/domains/customers/sync` — replace one-shot `syncCustomersFromOrders` with an event-driven projection (on order created/paid → update customer stats), or a materialized view.
- `packages/domains/customers/kpi` — KPI computation as a service (and actually populate `returning_rate`/`nps` if the UI expects them, or fix the contract).
- `packages/domains/identity` — unify customer identity across `orders`/`payment_records` via a shared `customer_id` FK instead of email-string coupling.

## Dependency observations (real)
- `app/api/admin/customers/route.ts` imports: `next/server`, `@/lib/db` (`getDb`, `buildSafeUpdate`), `@/lib/admin/permissions` (`requirePermission`).
- UI `app/admin/customers/page.tsx` imports: `useI18n`, `useToast`, `lib/date-utils` (`formatDateFull`), and the `Customer` type re-exported from the route file (`import type { Customer } from '@/app/api/admin/customers/route'`) — a coupling of UI to an API route's type.
- Customer identity is string-based (`customer_email`) in `orders` and `payment_records`; no join to `customers.id` anywhere observed.
- No dedicated `lib/customers*` service exists; the only customer-touching lib files are payment-related (`payment-service.ts`, `payment-record.ts`).
