# Booking (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities
- **File:** `app/api/booking/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` handler that creates a new order row in the `orders` SQLite table directly from the JSON body (customer, flight, destination, package).
  - ✔ Generates `order_number` (`ORD-<base36 timestamp>`) and accepts a client-supplied `booking_reference` (`body.id`).
  - ✔ Resolves package name/price via `getPackageName` / `getPackageTotal` from `lib/config.ts` (DB-backed settings).
  - ✔ Performs an explicit duplicate check on `booking_reference` and returns 409 if it already exists.
  - ✔ Persists `status='new'`, `dispatch_status='pending'`, `payment_status='pending'`, `currency='usd'`.
  - ✔ After insert, checks `payments` for a `completed` payment with the same `booking_reference` (webhook-before-POST race) and auto-confirms the order to `confirmed`/`paid`.
  - ✔ Applies rate-limit middleware on the POST.
- **Problem (real coupling/ownership issue observed):** This route is an HTTP handler that also acts as repository + pricing resolver + payment reconciliation. It writes business rows directly, has no validation layer (dates, 15-day rule, flight format), and reaches into `payments` for cross-domain reconciliation.

- **File:** `app/api/flights/validate/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` handler that validates a flight by querying `orders` for an existing row with matching `LOWER(airline)` + `LOWER(flight_number)`.
  - ✔ Returns `{ valid: true, airlineName, flightNumber }` if a past order exists, else `{ valid: false }`.
  - ✔ Returns 400 if `airline`/`flightNumber` query params are missing.
- **Problem (real coupling/ownership issue observed):** "Validation" here is really "have we seen this flight before in orders?" — it is a lookup against the orders table, not a true flight-data validator. No external flight API. Validation logic is embedded in a route, not a reusable validator.

- **File:** `app/api/bookings/search/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` handler returning raw `orders` rows matching `airline` + `flight_number` (case-insensitive).
  - ✔ Requires both `flightNumber` and `airline` query params (400 otherwise); rate-limited.
  - ✔ Returns `{ results, count }` — raw DB rows, no transformation.
- **Problem (real coupling/ownership issue observed):** Returns raw DB rows (over-fetching/leak risk) and duplicates the same flight lookup query that lives in `flights/validate/route.ts` and `lib/services/booking-service.ts`.

- **File:** `app/api/bookings/driver-assigned/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` handler that validates required fields (`bookingReference, driverName, vehicle, licensePlate`) and calls `triggerDriverAssigned` from `lib/n8n/client.ts`.
  - ✔ Returns 502 if the n8n trigger fails.
- **Problem (real coupling/ownership issue observed):** Lives under "bookings" but is actually a dispatch/notification trigger. Couples the booking surface to n8n notification delivery.

- **File:** `app/api/bookings/delivery-completed/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` handler that validates `bookingReference` and calls `triggerDeliveryCompleted` from `lib/n8n/client.ts`.
- **Problem (real coupling/ownership issue observed):** Same as driver-assigned — notification trigger mis-placed under "bookings"; no DB write, pure notification fan-out.

- **File:** `app/api/admin/reservations/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` lists all `orders` joined with `drivers` and `payments`, transforming each order row into the `Reservation` shape via `transformOrderToReservation`.
  - ✔ `POST` creates an `orders` row (admin-side, with `booking_reference = BK-<random>`, `order_number = ORD-<timestamp>`).
  - ✔ `PUT` performs a safe column-whitelisted update of `orders` via `buildSafeUpdate` (ALLOWED_ORDER_COLUMNS whitelist).
  - ✔ `DELETE` soft-cancels an order (`status='cancelled'`).
  - ✔ All verbs gated by `requirePermission('reservations', <action>)`.
- **Problem (real coupling/ownership issue observed):** Single file owns list + create + update + delete + the order→reservation transformer (a presentation/adapter concern). Joins payments/drivers inline. Mixes RBAC, repository, and DTO mapping.

- **File:** `app/api/admin/reservations/[id]/assign-driver/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` assigns a driver to an order: verifies driver is `status='available'`, verifies the order exists, then sets `assigned_to`, `assigned_at`, `dispatch_status='assigned'`, `status='assigned'`.
  - ✔ Returns the updated order joined with driver info.
- **Problem (real coupling/ownership issue observed):** This is dispatch logic living under "reservations". Directly mutates dispatch_status/status and re-implements driver-availability check inline instead of reusing `lib/dispatch/availability.ts`.

- **File:** `app/api/admin/orders/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` lists `orders` with optional `status`/`priority`/`search` filters, joining `payments` for `payment_status`.
- **Problem (real coupling/ownership issue observed):** Second "list orders" endpoint (the first is `admin/reservations`). Order vs Reservation terminology overlap is confusing and duplicated.

- **File:** `app/api/admin/orders/[id]/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` returns a single order joined with driver (name/phone/vehicle/plate) and builds a synthetic `history` timeline derived from timestamps (`created_at`, `assigned_at`, `dispatch_status`).
- **Problem (real coupling/ownership issue observed):** History is reconstructed from columns at read-time rather than from an event/audit table. Diverges from `order_status_history` table used elsewhere.

- **File:** `app/api/admin/orders/[id]/status/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `PUT` validates status against `[new, confirmed, in_progress, on_hold, completed, cancelled]`, updates `orders.status`, sets `status_changed_at`/`status_changed_by`, and writes an `order_status_history` row.
- **Problem (real coupling/ownership issue observed):** Status vocabulary here (`confirmed, in_progress, on_hold`) differs from the dispatch_status vocabulary (`pending, assigned, enroute, pickedup, completed`) and from reservations status — three overlapping status models with no shared enum.

- **File:** `lib/services/booking-service.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ Provides `searchBookings(airline, flightNumber)` and `countBookings()` — thin DB query wrappers over `orders`.
  - ✔ Defines internal `Booking` interface and `mapRowToBooking`/`mapStatus` row mappers (status normalized to draft/submitted/confirmed/failed — yet another status vocabulary).
- **Problem (real coupling/ownership issue observed):** A "service" that is really a repository with a third, divergent status enum. The `Booking` shape is separate from the `Reservation` shape and from raw `orders` columns, so three order representations coexist.

- **File:** `lib/reservations-types.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ Defines the `Reservation`, `Guest`, `Service`, `DriverInfo` TypeScript interfaces and `ReservationStatus`, `PaymentStatus`, `VIPStatus` unions used by the admin dashboard client.
- **Problem (real coupling/ownership issue observed):** Type-only file, but `ReservationStatus`/`PaymentStatus` here do not match the strings actually stored in `orders`/`payments` (e.g. `awaiting_payment`, `partial`, `assigned`, `in_progress`), so the types are aspirational rather than faithful.

- **File:** `lib/reservations-api.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ Browser-side fetch wrappers (`fetchReservations`, `fetchReservationById`, `assignDriverToReservation`, `sendWhatsAppMessage`, `cancelReservation`) that call the admin reservation routes.
  - ✔ `sendWhatsAppMessage` posts to `.../whatsapp` which does NOT exist as a route (no such endpoint is present) — dangling client call.
- **Problem (real coupling/ownership issue observed):** Client module imported into the browser bundle that depends on `lib/db.ts` transitively via `lib/reservations-types`? No — but it imports types only. The `sendWhatsAppMessage` helper targets a missing endpoint. Mixes data-fetching with an action that has no backing API.

- **File:** `lib/trm.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ Fetches live USD/COP rate from `api.exchangerate-api.com/v4/latest/USD` with a 1-hour in-memory cache and a DB-backed fallback rate (`getTrmFallbackRate` from `lib/config.ts`).
  - ✔ Provides `convertCopToUsd`, `formatCop`, `formatUsd`.
- **Problem (real coupling/ownership issue observed):** Currency/exchange concern is pulled into the Booking analysis because payment/report code imports it; it is a cross-cutting infra concern, not booking-specific. Module naming (`TRM`) is unrelated to booking domain.

## Module-level real responsibilities
- ✔ Accept a booking (public `POST /api/booking`) and create an `orders` row; reconcile against a pre-arrived payment.
- ✔ Lookup/validate flights by searching prior `orders`.
- ✔ List/create/update/cancel orders as "reservations" (admin).
- ✔ Assign a driver to a reservation/order (admin).
- ✔ Build order→Reservation DTOs and a synthetic status history.
- ✔ Provide a USD/COP exchange-rate helper used by payments/reports.
- ✔ Trigger n8n driver-assigned / delivery-completed notifications from booking-surface routes.

## Proposed split (target per Blueprint domains/packages)
- `BookingService` — create/read/cancel booking, idempotency/duplicate check (→ `packages/domains/booking`).
- `BookingRepository` — DB access for `orders` (→ `packages/db`).
- `BookingValidator` — flight format, 15-day advance rule, arrival/return date rules (→ `packages/domains/booking` or `packages/validation`).
- `FlightLookupService` — "have we seen this flight" lookup, separated from true validation (→ `packages/domains/booking`).
- `ReservationMapper` / `OrderAdapter` — single canonical order→DTO transformer replacing `transformOrderToReservation` and `mapRowToBooking` (→ `packages/domains/booking` or a shared mapper).
- `ReservationRepository` + `ReservationStatus` enum — unify the three status vocabularies (orders.status / dispatch_status / ReservationStatus) (→ `packages/domains/booking` + `packages/domains/dispatch`).
- `NotificationPublisher` — emit typed events instead of calling n8n/WhatsApp directly from route handlers (→ `packages/infra/messaging`).
- `FxService` / `TrmService` — own `lib/trm.ts` under `packages/infra` (currency is cross-cutting).
- `PaymentReconciliationService` — the webhook-before-POST auto-confirm belongs in payments, not the booking route.

## Dependency observations (real)
- `app/api/booking/route.ts` imports `@/lib/db`, `@/lib/config`, `@/lib/rate-limit`.
- `app/api/flights/validate/route.ts` and `app/api/bookings/search/route.ts` import `@/lib/db`.
- `app/api/bookings/driver-assigned/route.ts` and `delivery-completed/route.ts` import `@/lib/n8n/client` (cross-domain notification call from the booking surface).
- `app/api/admin/reservations/route.ts` (and `[id]/assign-driver`) import `@/lib/db`, `@/lib/admin/permissions`, and reuse `buildSafeUpdate` from `@/lib/db`.
- `lib/services/booking-service.ts` imports `@/lib/db` (server-only) — yet is conceptually a "service" that could be pulled into client context; must stay server-only.
- `lib/reservations-api.ts` is a browser module that calls `/api/admin/*` routes and contains a `sendWhatsAppMessage` call to a non-existent `/whatsapp` endpoint.
- `lib/trm.ts` is imported by `app/api/admin/payments/route.ts` (payments domain), confirming TRM is a shared infra dependency, not booking-owned.
- No file under Booking imports `lib/dispatch/availability.ts` even though `assign-driver` re-implements availability checks — duplication, not a shared call.
