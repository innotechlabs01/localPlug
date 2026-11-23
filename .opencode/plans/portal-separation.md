# Plan: Self-Contained Hotel & Driver Portals (Admin UNTOUCHED)

## Context
Three portals: `/admin` (role `admin`), `/hotel` (role `hotel_manager`), `/driver` (role `driver`).
Today they are tangled and fragile:
- **Admin "Access Restricted"** — your Clerk account `user_3E2Ipk4ivA3SWd2jMuZuS0HOP4t` was deleted/recreated; DB `users.clerk_id` no longer matches. `getUserPermissions()` tries to auto-register a viewer, but `users.email` is `UNIQUE` so the `INSERT OR IGNORE` is silently dropped → 403 → "Access Restricted". (Running server PID 10366 serves stale code; debug edit wasn't compiled.)
- **Hotel/Driver 404s** — `hotels.id=2` `clerk_user_id: null`; `drivers.id=18` wrongly carries the hotel_manager's Clerk ID; `drivers.id=17` `clerk_user_id: null`; `hotels.id=1` orphaned.
- **No role gating** — any authenticated user can open any portal; hotel_manager on `/admin` sees a stripped admin sidebar.

User directives: **separate the files**, create **own dashboards** for hotel and driver, **do NOT modify the admin** (avoid regressions), move reservations into hotel's own files, same approach for driver, and restructure this plan accordingly.

## Hard boundary
- **Admin stays 100% untouched** — no UI, no `app/admin/*`, no `lib/admin/permissions.ts` changes. The only admin touch is a **DB `clerk_id` update** to unblock login. (Admin's auth hardening is explicitly deferred to avoid risk; noted as future work.)
- Hotel and Driver become **self-contained portals**: their own lib, their own API routes, their own dashboards. Shared only via a NEW `lib/auth/resolve.ts` (never edits admin files).

---

## Phase 1 — Shared auth lib (new file, does not touch admin)
- **`lib/auth/resolve.ts` (NEW)**: `resolveCurrentUser()` looks up `users` by `clerk_id`; if missing, links by email (fetch primary email from Clerk, `UPDATE clerk_id`); if still missing returns `{ error: 'contact_admin', status: 403 }`. No silent viewer auto-register.
- **`middleware.ts` (MODIFY — global, not admin-specific)**: for `/admin`,`/hotel`,`/driver` (+ their `/api/*`), read `role` from Clerk `publicMetadata`; redirect to the correct portal when mismatched; 401/403 on API when role≠portal. Removes the "hotel_manager sees admin sidebar" tangling permanently.

## Phase 2 — Hotel portal (self-contained, NEW files)
Reservations currently only exist under admin (`lib/reservations-api.ts` → `/api/admin/reservations`). Move a **hotel-scoped** copy into hotel's own files.
- **`lib/hotel/reservations.ts` (NEW)**: query reservations `WHERE hotel_id = <current hotel>`; types re-use `lib/reservations-types.ts`.
- **`lib/hotel/dashboard.ts` (NEW)**: aggregate metrics — reservation count/status mix, room inventory, additional services, revenue with commission (`base × (1+rate)`, driver payout split).
- **`app/api/hotel/reservations/route.ts` (NEW)**: `GET` hotel reservations (gated to hotel_manager).
- **`app/api/hotel/dashboard/route.ts` (NEW)**: `GET` metrics for the dashboard.
- **`app/hotel/page.tsx` (BUILD OUT)**: dashboard UI visualizing reservations, rooms, services, revenue. Keep existing `app/api/hotel/{profile,rooms,services,metrics,orders,ensure}` and `lib/auth/hotel.ts` as-is.

## Phase 3 — Driver portal (self-contained, NEW files)
- **`lib/driver/dashboard.ts` (NEW)**: aggregate assigned trips, earnings (`tripPrice × commissionRate`), availability status, trip history.
- **`app/api/driver/dashboard/route.ts` (NEW)**: `GET` driver metrics.
- **`app/driver/page.tsx` (BUILD OUT)**: dashboard UI visualizing assignments + earnings. Keep existing `app/api/driver/{profile,metrics,my-assignments,list,ensure}` and `lib/auth/driver.ts` as-is.

## Phase 4 — DB fixes (unblock immediately)
1. **Admin** — `UPDATE users SET clerk_id = <current session Clerk ID> WHERE id = 8` (+ set Clerk `publicMetadata.role='admin'`).
2. **Hotel link** — `UPDATE hotels SET clerk_user_id = 'user_3GY7ZA9xdEID4MIyZxO0CI516Jd' WHERE id = 2`.
3. **Driver id=18 conflict** — detach hotel_manager's Clerk ID (set its real driver `clerk_user_id`, or `NULL` + `profile_complete=0` "needs login").
4. **Driver id=17** — set real `clerk_user_id` or mark `profile_complete=0`.
5. **Orphaned hotel id=1** — assign to hotel_manager or deactivate if unused.

## Phase 5 — Verify
- Restart dev server (current PID 10366 stale).
- `/admin` unchanged, works after DB clerk_id fix (no code change).
- `/hotel` dashboard shows reservations/rooms/services/revenue; `/api/hotel/reservations` & `/api/hotel/dashboard` 200.
- `/driver` dashboard shows assignments/earnings; `/api/driver/dashboard` 200.
- Cross-portal: hotel_manager on `/admin` → redirected to `/hotel`; driver on `/admin` → `/driver`.
- `npx tsc --noEmit` clean.

## Files touched
- NEW: `lib/auth/resolve.ts`, `lib/hotel/reservations.ts`, `lib/hotel/dashboard.ts`, `app/api/hotel/reservations/route.ts`, `app/api/hotel/dashboard/route.ts`, `lib/driver/dashboard.ts`, `app/api/driver/dashboard/route.ts`
- BUILD OUT: `app/hotel/page.tsx`, `app/driver/page.tsx`
- MODIFY (global, not admin): `middleware.ts`
- DATA: `users`, `hotels`, `drivers` rows
- **ADMIN**: UNTOUCHED (only DB `clerk_id` update)
