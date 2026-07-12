# Drivers (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `app/api/admin/drivers/route.ts`
  - **Responsibilities (real):** ✔ `GET` lists all drivers with a correlated `active_orders` count (orders where `assigned_to = d.id AND dispatch_status='assigned'`); computes a `doc_status` (`valid`/`warning`/`expired`) in JS by comparing `license_expiry`/`soat_expiry`/`tech_inspection_expiry`/`insurance_expiry` against `now` and `now+30d`. ✔ `POST` creates a driver with defaults `status='available'`, `rating=5.0`, `category='standard'`, validates `name`/`vehicle`/`plate`. ✔ `PUT` uses `buildSafeUpdate` against `ALLOWED_DRIVER_COLUMNS` (20 columns). ✔ `DELETE` is a soft delete (`status='inactive'`). ✔ All methods call `requirePermission('drivers', <verb>)`.
  - **Problem (real):** Document-expiry compliance logic (the `doc_status` derivation) is duplicated in JS here AND again in `app/admin/drivers/page.tsx` (`docReason`). Business rule lives in two places. No dedicated driver repository/service layer — raw SQL in the route.

- **File:** `app/api/admin/drivers/ranking/route.ts`
  - **Responsibilities (real):** ✔ `GET` returns top-20 drivers by `rating DESC, total_trips DESC` with correlated `total_orders` and `completed_orders` counts. Only auth via Clerk `auth()` (no `requirePermission` check, unlike the parent route).
  - **Problem (real):** Inconsistent authorization model vs `route.ts` (uses raw `auth()` not `requirePermission`). No pagination params; ranking algorithm hardcoded.

- **File:** `app/api/admin/drivers/[id]/history/route.ts`
  - **Responsibilities (real):** ✔ `GET` builds a timeline for one driver: a synthetic `created` event, an `available` status event, and one event per order keyed off `dispatch_status` (`assigned`/`enroute`/`pickedup`/`completed`). Auth via Clerk `auth()` only.
  - **Problem (real):** Timeline semantics are hand-built string mappings in the route; not backed by a real events table. No permission check.

- **File:** `app/api/admin/drivers/[id]/photo/route.ts`
  - **Responsibilities (real):** ✔ `PUT` updates `drivers.photo_url`. Clerk `auth()` only.
  - **Problem (real):** No permission check, no validation of URL, no image upload/hosting — only stores an external URL.

- **File:** `app/api/admin/drivers/[id]/performance/route.ts`
  - **Responsibilities (real):** ✔ `GET` returns up to 12 rows from `driver_performance` (ordered by `period DESC`) plus a summary aggregate from `orders` (`total`/`completed`/`cancelled`). Clerk `auth()` only.
  - **Problem (real):** Reads a `driver_performance` table whose population/writer is not in this domain (no writer route found under drivers). Auth inconsistency again.

- **File:** `app/api/admin/drivers/[id]/documents/route.ts`
  - **Responsibilities (real):** ✔ `POST` records a driver document by mapping `doc_type` (`license`/`soat`/`tech_inspection`/`insurance`/`other`) onto the matching `*_expiry` column on `drivers`; validates types; uses `buildSafeUpdate` against `ALLOWED_DRIVER_DOC_COLUMNS`. Clerk `auth()` only.
  - **Problem (real):** Documents are NOT stored as rows — they mutate the driver's expiry columns, collapsing document metadata into the drivers row. No `documents` table read path; no file storage (URL-only via other flows).

- **File:** `lib/dispatch/availability.ts`
  - **Responsibilities (real):** ✔ `checkDriverAvailability` queries `assignments` for overlapping time blocks (`block_until > proposedStart`) and detects conflicts. ✔ `getEstimatedDurationMinutes` infers trip duration from package name (`vip`/`premium`=90, `hour`/`tour`=180, dropoff=60, else 60). ✔ Constants `DROPOFF_BLOCK_MINUTES=120`, `DEFAULT_BLOCK_MINUTES=90`; date-math helpers `parseTimeToMinutes`, `minutesToEndTime`, `buildBlockUntil`.
  - **Problem (real):** This is the only driver-domain lib module, but it is dispatch-centric (`assignments` table) and is NOT imported by any driver admin route — only by `app/api/assignments/route.ts` and `app/api/admin/dispatch/route.ts` (outside this domain's listed scope). Driver "availability" thus has no connection to the admin Drivers UI.

- **File:** `app/admin/drivers/page.tsx`
  - **Responsibilities (real):** ✔ Admin UI: fetches `/api/admin/drivers`; computes KPIs (`total`/`available`/`assigned`/`vip`/`alerts`/`avg`) and client-side filters; 6-step create/edit modal; renders roster, profile, compliance, performance panels; computes `docReason`/`docStatus` locally replicating the route's expiry logic; hardcodes derived metrics (e.g. revenue `= total_trips * 68`, satisfaction) that are display-only fiction.
  - **Problem (real):** Duplicated document-expiry logic vs `route.ts`. Performance metrics (`* 68`, `3.2%` cancel) are fabricated in the UI, not from the DB. All CRUD verbs wired to a single `/api/admin/drivers` endpoint with no dedicated service.

## Module-level real responsibilities
- ✔ Driver roster CRUD (admin) with soft-delete and column-allowlist safety.
- ✔ Document/compliance expiry status computation (duplicated: route + UI).
- ✔ Driver ranking, history timeline, photo URL, performance summary (read-only aggregates).
- ✔ Driver dispatch availability / conflict detection (in `lib/dispatch`, consumed by dispatch APIs, not driver admin).

## Proposed split (target per Blueprint domains/packages)
- `packages/domains/drivers` — `DriverService` (CRUD, soft-delete), `DriverRepository` (raw SQL moved here).
- `packages/domains/drivers/validators` — column allowlist (replace `ALLOWED_DRIVER_COLUMNS` inline arrays).
- `packages/domains/drivers/compliance` — single owner of doc-expiry → status derivation (used by route and UI via API field, not duplicated).
- `packages/infra/dispatch` — move `lib/dispatch/availability.ts` here as `AvailabilityService` + `AssignmentRepository`.
- `packages/domains/drivers/events` — real `driver_events` table + publisher instead of hand-built timeline strings.
- `packages/domains/drivers/documents` — `DriverDocument` entity/repo (rows) replacing expiry-column mutation.

## Dependency observations (real)
- Driver admin routes import: `next/server`, `@/lib/db` (`getDb`, `buildSafeUpdate`), `@/lib/admin/permissions` (`requirePermission`), `@/lib/dispatch/availability` (NOT used by driver routes), `@clerk/nextjs/server` (`auth`).
- Sub-routes (`ranking/history/photo/performance/documents`) bypass `requirePermission` and rely solely on Clerk `auth()` — inconsistent with parent `route.ts`.
- UI (`app/admin/drivers/page.tsx`) imports `useI18n`, `adminFetch`, `useToast`, `date-utils` indirectly; embeds business rules (doc status, fake metrics).
- `lib/dispatch/availability.ts` is imported by `app/api/assignments/route.ts` and `app/api/admin/dispatch/route.ts` (dispatch domain), revealing the only lib-level driver logic is actually a dispatch concern.
