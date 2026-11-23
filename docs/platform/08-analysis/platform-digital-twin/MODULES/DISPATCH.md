# Dispatch (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities
- **File:** `app/api/admin/dispatch/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` returns `{ orders, drivers, counts }` for the dispatch board. Filters `orders` by `tab` (pending/assigned/enroute/completed/vip via `dispatch_status` or priority) and `search`; lists `drivers` filtered by `category`; computes pending/assigned/enroute/pickedup counts.
  - ✔ `PUT` action router with three actions:
    - `assign`: validates order+driver exist, rejects if an active assignment already exists, computes estimated duration via `getEstimatedDurationMinutes`, runs `checkDriverAvailability`, inserts an `assignments` row (`status='pending_acceptance'`), sets order `dispatch_status='pending_acceptance'`, and triggers `triggerDriverNewAssignment` (n8n).
    - `unassign`: frees the driver (`status='available'`), resets the order's `assigned_to`/`dispatch_status`, and cancels the active assignment(s).
    - `status`: updates `orders.dispatch_status` to one of `pending/assigned/enroute/pickedup/completed`; on `enroute`/`completed` also advances the assignment status and frees the driver.
  - ✔ All verbs gated by `requirePermission('dispatch', <action>)`.
- **Problem (real coupling/ownership issue observed):** A single 289-line route that is repository + availability engine + notification trigger + status machine. It writes to both `orders` and `assignments` and emits n8n events. The `assign` action duplicates logic in `app/api/assignments/route.ts`.

- **File:** `app/api/assignments/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` creates an assignment (mirrors the `dispatch` `assign` action): validates order+driver, checks for an existing active assignment (409), computes duration, runs `checkDriverAvailability` (409 on conflict), inserts `assignments` (`pending_acceptance`), sets order `dispatch_status='pending_acceptance'`, and triggers `triggerDriverNewAssignment` (n8n).
  - ✔ `GET` lists `assignments` joined with `orders` + `drivers`, filterable by `status`/`driverId`.
  - ✔ Gated by `requirePermission('dispatch', 'update'|'view')`.
- **Problem (real coupling/ownership issue observed):** Near-duplicate of the `dispatch` `assign` action — same availability check, same insert, same n8n trigger, same 409 guard. Two code paths can create assignments.

- **File:** `app/api/assignments/[id]/accept/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` accepts a pending assignment: requires webhook auth (`requireWebhookAuth`), loads the assignment+order+driver, rejects if not `pending_acceptance`, computes `block_until` (120 min for dropoff/return, else max(duration+30, 90)), sets `assignments.status='accepted'` + `block_until`, sets order `assigned_to`/`dispatch_status='assigned'`/`assigned_at`, sets driver `status='busy'`, and triggers `triggerClientDriverConfirmed` (n8n WhatsApp to client).
- **Problem (real coupling/ownership issue observed):** Status transition + driver blocking math + order mutation + driver mutation + notification all in one route. The `blockUntil` computation is reimplemented here (overlaps `lib/dispatch/availability.ts` `buildBlockUntil`, but with different constants/logic).

- **File:** `app/api/assignments/[id]/decline/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` declines a pending assignment (webhook auth): sets `assignments.status='declined'` + records reason + clears `block_until`, and resets the order (`dispatch_status='pending'`, `assigned_to=NULL`, `assigned_at=NULL`).
- **Problem (real coupling/ownership issue observed):** Mirrors part of the `unassign` action; order reset logic duplicated between this route and `dispatch` `unassign`/accept.

- **File:** `lib/dispatch/availability.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `checkDriverAvailability` — queries `assignments` for the driver's active rows with `block_until > proposedStart`, then checks time-overlap against the proposed window; returns `{ available, conflicts }`. Supports `excludeAssignmentId`.
  - ✔ `getEstimatedDurationMinutes(packageName, isDropoff)` — heuristic: dropoff=60, name contains `vip`/`premium`=90, contains `hour`/`tour`=180, else 60.
  - ✔ Internal helpers `parseTimeToMinutes`, `minutesToEndTime`, `buildBlockUntil` (DROPOFF_BLOCK_MINUTES=120, DEFAULT_BLOCK_MINUTES=90).
- **Problem (real coupling/ownership issue observed):** This is the only genuinely reusable domain library in dispatch, but `buildBlockUntil` constants (90/120) diverge from the `accept` route's block math (max(duration+30,90)/120). Two sources of truth for "how long does a driver stay blocked".

## Module-level real responsibilities
- ✔ Present the dispatch board (orders needing drivers, available drivers, counts).
- ✔ Create assignments (driver ↔ order) with availability conflict detection.
- ✔ Drive the assignment lifecycle: pending_acceptance → accepted → en_route → completed (and declined/cancelled), including driver `busy`/`available` toggling.
- ✔ Compute driver blocking windows and estimated service duration.
- ✔ Notify (via n8n/WhatsApp) on new assignment, driver confirmation, and (from booking routes) driver-assigned / delivery-completed.

## Proposed split (target per Blueprint domains/packages)
- `DispatchService` / `AssignmentService` — orchestrate assign/unassign/accept/decline/status (→ `packages/domains/dispatch`).
- `AssignmentRepository` / `DispatchRepository` — DB access for `assignments` and dispatch-filtered `orders` (→ `packages/db`).
- `AvailabilityService` — `checkDriverAvailability` + `getEstimatedDurationMinutes` + single canonical `buildBlockUntil` (→ `packages/domains/dispatch`).
- `AssignmentValidator` — reject duplicate active assignments, valid status transitions (→ `packages/domains/dispatch`).
- `DispatchEvents` / `NotificationPublisher` — emit typed events; routes call this instead of calling `lib/n8n/client` directly (→ `packages/infra/messaging`).
- `DriverStatusService` — owns driver `available`/`busy` state transitions (currently scattered across dispatch/assign/accept/decline routes) (→ `packages/domains/driver`).
- `DispatchReadModel` — the board query (orders+drivers+counts) as a single read model (→ `packages/domains/dispatch` or `packages/reporting`).

## Dependency observations (real)
- `app/api/admin/dispatch/route.ts` imports `@/lib/db`, `@/lib/admin/permissions`, `@/lib/n8n/client` (`triggerDriverAssigned`, `triggerDriverNewAssignment`), `@/lib/dispatch/availability`.
- `app/api/assignments/route.ts` imports the same four modules (permissions, n8n, availability, db); `assign` action duplicates `dispatch` `assign`.
- `app/api/assignments/[id]/accept/route.ts` imports `@/lib/db`, `@/lib/webhook-auth`, `@/lib/n8n/client` (`triggerClientDriverConfirmed`), `@/lib/dispatch/availability`.
- `app/api/assignments/[id]/decline/route.ts` imports `@/lib/db`, `@/lib/webhook-auth`.
- `lib/dispatch/availability.ts` imports `@/lib/db` (server-only) — correctly isolated as the reusable core.
- Both notification triggers (`triggerDriverNewAssignment`, `triggerClientDriverConfirmed`, `triggerDriverAssigned`, `triggerDeliveryCompleted`) live in `lib/n8n/client.ts`; dispatch routes call them directly, so dispatch is tightly coupled to the n8n/WhatsApp transport.
- Dispatch mutates `orders.dispatch_status`/`status`/`assigned_to` directly (imperative coupling to the Booking/Order aggregate) and toggles `drivers.status` (coupling to the Driver/vehicle aggregate).
