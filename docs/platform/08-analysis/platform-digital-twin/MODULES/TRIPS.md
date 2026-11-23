# Trips (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities
There is **NO dedicated Trips module, package, service, or route** in the current monolith. "Trip" is not a first-class entity. The concept is *embedded* in three places:

- **Embedding location 1 — `orders.additional_trips` (JSON column on the booking/order aggregate)**
  - `app/api/booking/route.ts` (lines 71, 21–22): reads `body.destination.additionalTrips` and persists it as a JSON string into `orders.additional_trips`. There is no trip entity — it is a free-form `string[]` attached to an order.
  - `app/api/admin/reservations/route.ts` (line 59): `transformOrderToReservation` parses `additional_trips` back into `additionalTrips: string[]` on the `Reservation` DTO. Again, an opaque string array, no trip lifecycle.
  - `lib/services/booking-service.ts` (lines 17, 63): the `DestinationData` interface carries `additionalTrips?: string[]` and `mapRowToBooking` JSON-parses it. Pure pass-through.

- **Embedding location 2 — `assignments.service_type` (dispatch rows: pickup / dropoff / return)**
  - `app/api/assignments/route.ts` and `app/api/admin/dispatch/route.ts`: a "trip" in dispatch terms is an `assignments` row whose `service_type` is `pickup`, `dropoff`, or `return` (the `isDropoff`/`serviceType === 'return'` checks). The assignment IS the trip record for dispatch purposes.
  - `app/api/assignments/[id]/accept/route.ts` (lines 50–57): block-window math branches on `service_type === 'dropoff' || 'return'`, i.e. the trip type drives driver availability blocking.

- **Embedding location 3 — Experience/pricing catalog (`lib/config.ts`)**
  - `lib/config.ts` (lines 29–34, 254–267): "experiences" (comuna13, guatape, coffee, paragliding, nightlife, vip-city) priced via `getExperiencePrice`. These are purchasable trip-like add-ons but are stored only as config key/value rows and surfaced in `getAllPublicConfig().experiences`. They are not linked to an order's `additional_trips` anywhere in the code read.

- **Reporting pseudo-"trips"**
  - `app/api/admin/payments/route.ts` (line 21, 86): `drivers.total_trips` is aggregated in the driver-payout query (`COUNT(*) ... WHERE assigned_to IS NOT NULL`), i.e. a "trip" for payout purposes is counted as an assigned order, not a trip entity.
  - `lib/db/migrations/010_drivers_table.sql` defines `total_trips` on the drivers table.

- **File:** `lib/reservations-types.ts`
  - ✔ The `Reservation` interface includes `additionalTrips?: string[]` (line 47) — confirming trips are modeled only as an optional string list on a reservation, never as their own type.

## Module-level real responsibilities
- ✔ Store extra trip requests as a JSON string array attached to an order (`additional_trips`).
- ✔ Represent a dispatched trip as an `assignments` row with a `service_type` of pickup/dropoff/return.
- ✔ Price experience/trip add-ons via config (`getExperiencePrice`).
- ✔ Count driver "trips" as assigned orders for payout reporting.

## Proposed split (target per Blueprint domains/packages)
- `TripService` / `TripRepository` — promote `additional_trips` from a JSON blob on `orders` to a real `trips` table linked to an order (→ `packages/domains/trip` or folded into `packages/domains/booking`).
- `TripType` enum — unify `pickup`/`dropoff`/`return` (dispatch `service_type`) with the order's `additional_trips` entries and the experience catalog (→ `packages/domains/trip` / `packages/domains/dispatch`).
- `ExperienceService` — the experience catalog in `lib/config.ts` becomes a proper domain with prices linked to bookings (→ `packages/domains/booking` or `packages/domains/trip`).
- `DriverTripStats` — `drivers.total_trips` counting belongs in a `DriverService`/read model, not recomputed in the payments route (→ `packages/domains/driver`).

## Dependency observations (real)
- There is no trip dependency graph of its own. Trip data is read/written through:
  - `app/api/booking/route.ts` → `@/lib/db` (writes `additional_trips`).
  - `app/api/admin/reservations/route.ts` → `@/lib/db` (reads/parses `additional_trips`).
  - `lib/services/booking-service.ts` → `@/lib/db` (parses `additional_trips`).
  - Dispatch trip semantics come from `assignments.service_type`, which is written by `app/api/assignments/route.ts` and `app/api/admin/dispatch/route.ts` (both → `@/lib/db` + `@/lib/dispatch/availability.ts`).
  - Experience prices: `lib/config.ts` → `@/lib/db` (settings table); consumed by `getAllPublicConfig()`.
- No file imports a "trip service" because none exists. Any future `TripService` would currently be assembled from fragments in Booking (`additional_trips`), Dispatch (`assignments.service_type`), and Config (experiences).
