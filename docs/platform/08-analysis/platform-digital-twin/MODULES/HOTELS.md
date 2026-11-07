# Hotels (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `app/api/admin/hotels/route.ts`
  - **Responsibilities (real):** ✔ `GET` lists hotels, scoped via `resolveHotelContext()` (hotel managers see only their hotel), with a correlated room count per hotel (`room_count`/`available_rooms`). ✔ `POST` creates a hotel AND a Clerk user for the hotel manager (`client.users.createUser` with `role:'hotel_manager'`), inserts a local `users` row (`role_id=5`, `hotel_id`), and fires `triggerManagerCreated` (n8n WhatsApp, fire-and-forget). ✔ `PUT`/`DELETE` guarded by `requirePermission('hotels', <verb>)` plus context check; `DELETE` cascades via FK to rooms/promotions/room_bookings. ✔ Uses `buildSafeUpdate` over `ALLOWED_COLUMNS` (13 cols). Slug auto-generated from name if absent; uniqueness checked.
  - **Problem (real):** Hotel creation is a transaction spanning three systems (local DB hotel row + Clerk user + n8n notification) inline in the route. Clerk failure is swallowed with a warning but the hotel row persists (partial state). Manager-provisioning logic (identity + auth + notification) belongs in an identity/service package, not the hotels route.

- **File:** `app/api/admin/hotels/stats/route.ts`
  - **Responsibilities (real):** ✔ `GET` returns hotel dashboard stats: room stats (total/available/unavailable/avg/min/max price), booking stats from `room_bookings` (total revenue, discounts, confirmed/checked_in/checked_out/cancelled), today's activity, last-10 recent bookings (joined to `orders`), promotion stats, and revenue split. ✔ Computes `platformRevenue = totalRevenue * commissionRate / (1 + commissionRate)` and `hotelRevenue = totalRevenue - platformRevenue` in JS.
  - **Problem (real):** Revenue-split math (commission formula) is embedded in the stats route. Commission-rate semantics differ from the display-price calc in `app/api/hotels/route.ts` and `app/api/admin/rooms/route.ts` (those use `price * (1 + rate)`, i.e. commission added on top; stats uses `rate/(1+rate)` share) — two different commission models in the codebase.

- **File:** `app/api/hotels/route.ts` (public, unauthenticated)
  - **Responsibilities (real):** ✔ `GET` lists `active` hotels with their available rooms for the public booking flow; computes each room's `display_price = basePrice + basePrice*commissionRate`. ✔ No auth (`getDb` only).
  - **Problem (real):** Public endpoint performs commission pricing; duplication of the commission-on-top formula. `commission_rate` stored both as a DB column and defaulted to `0.10`.

- **File:** `app/api/admin/rooms/route.ts`
  - **Responsibilities (real):** ✔ `GET` lists rooms joined to hotels (with `commission_rate`), scoped by `resolveHotelContext()`; computes `display_price = basePrice + basePrice*commissionRate`. ✔ `POST`/`PUT`/`DELETE` with `requirePermission('hotels', <verb>)`; managers restricted to their own hotel; `buildSafeUpdate` over `ALLOWED_COLUMNS` (8 cols).
  - **Problem (real):** Rooms are managed under the `hotels` permission verb, not a `rooms` verb — rooms have no independent authorization domain. Commission display-price logic duplicated from public hotels route.

- **File:** `app/api/admin/promotions/route.ts`
  - **Responsibilities (real):** ✔ `GET` lists promotions joined to hotels, context-scoped; `POST` validates promo-code uniqueness (`type='promo_code'`), verifies hotel exists; `PUT`/`DELETE` with hotel-manager scoping (hotel_id check) and `buildSafeUpdate` over `ALLOWED_COLUMNS` (8 cols); converts `is_active` bool→int.
  - **Problem (real):** Promotions live under the `hotels` permission verb; enforcement scattered across GET/POST/PUT/DELETE each re-checking `ctx.hotelId`. No promotion service/repo.

- **File:** `app/api/promotions/validate/route.ts` (public, unauthenticated)
  - **Responsibilities (real):** ✔ `GET` validates a promo `code` against `promotions` (`type='promo_code'`), checks `is_active`, date window (`starts_at`/`ends_at`), and `usage_limit` vs `usage_count`; returns discount info. ✔ Code uppercased before lookup.
  - **Problem (real):** Validation rules (active/date/usage) are duplicated logic that should be a `PromotionService.validate()`; `usage_count` is never incremented here (no redemption write path observed in this domain).

- **File:** `lib/admin/hotel-auth.ts`
  - **Responsibilities (real):** ✔ `resolveHotelContext()` maps the Clerk user → local `users`/`roles` join to derive `{ hotelId, isAdmin, roleName, error }`; admins unrestricted, hotel_managers scoped to their `hotel_id`, others 403. ✔ `requireHotelAccess(hotelId)` enforces manager-only access to a specific hotel.
  - **Problem (real):** This auth helper is the real ownership/tenancy boundary for the entire Hotels module; it is shared infra but tightly coupled to the hotels domain's data model (`users.hotel_id`, role names). Should live in an `identity`/`auth` package.

- **File:** `app/admin/hotels/page.tsx`
  - **Responsibilities (real):** ✔ Admin/manager UI: fetches hotels/rooms/promotions/stats/manager; computes aggregate KPIs; 3 tabs (Rooms/Promotions/Bookings); inline commission-preview math (`100 * (1 + commission_rate)`); create/edit modals for hotel/room/promo; manager assignment via `/api/admin/users/hotel-assign`; renders created-manager credentials.
  - **Problem (real):** Commission preview formula duplicated again in the UI (`base * (1+rate)`). Manager-assignment UI calls endpoints outside the hotels routes (`/api/admin/users/hotel-assign`, `/api/admin/employees`) — ownership split across domains.

## Module-level real responsibilities
- ✔ Hotel partner CRUD + manager (Clerk) provisioning + WhatsApp notification.
- ✔ Room inventory CRUD with commission-inclusive display pricing.
- ✔ Promotion CRUD + public promo-code validation.
- ✔ Hotel dashboard stats with revenue/commission split.
- ✔ Tenancy scoping (admin vs hotel_manager) via `lib/admin/hotel-auth.ts`.

## Proposed split (target per Blueprint domains/packages)
- `packages/domains/hotels` — `HotelService`, `HotelRepository`, `HotelValidator`.
- `packages/domains/hotels/rooms` — `RoomService`/`RoomRepository` (own permission verb).
- `packages/domains/hotels/promotions` — `PromotionService` (CRUD + `validate()` + redemption increment), `PromotionRepository`.
- `packages/domains/hotels/stats` — `HotelStatsService` owning the (single, corrected) commission model.
- `packages/infra/pricing` — single `CommissionCalculator` used by public hotels route, rooms route, stats route, and UI (remove 4 copies).
- `packages/identity` — absorb `lib/admin/hotel-auth.ts` (`resolveHotelContext`/`requireHotelAccess`) + manager provisioning (Clerk + n8n) currently embedded in `hotels/route.ts` POST.

## Dependency observations (real)
- All hotel/room/promo admin routes import: `next/server`, `@/lib/db` (`getDb`, `buildSafeUpdate`), `@/lib/admin/permissions` (`requirePermission`), `@/lib/admin/hotel-auth` (`resolveHotelContext`), and (`hotels/route.ts` only) `@clerk/nextjs/server` + `@/lib/n8n/client` (`triggerManagerCreated`).
- Public routes (`app/api/hotels/route.ts`, `app/api/promotions/validate/route.ts`) import only `next/server` + `@/lib/db`.
- UI `app/admin/hotels/page.tsx` imports `useI18n`, `adminFetch`, `useToast`, and calls out to `/api/admin/users/hotel-assign` and `/api/admin/employees` (user/employee domain) for manager handling.
- Commission-rate concept also defined in `lib/config.ts` (`HOTEL_COMMISSION`, `HOTEL_REVENUE_NIGHT`) — config keys exist but the routes use the DB `commission_rate` column, so config is effectively unused for hotels.
