# Cases (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `app/api/admin/cases/route.ts`
  - **Responsibilities (real):** ✔ `GET` (no id) lists all cases with correlated counts (`event_count`, `document_count`, `pending_tasks`); `GET?id=` returns the single case plus its `case_events`, `case_documents`, `case_tasks` in one payload. ✔ `POST` creates a case with `case_number = 'CASE-' + Date.now()`, derives `client_initials` from `client_name`, defaults `case_category='laboral'`, `status='open'`. ✔ `PUT` uses `buildSafeUpdate` over `ALLOWED_CASE_COLUMNS` (8 cols); on `status='closed'` sets `closed_at = datetime('now')`. ✔ All verbs guarded by `requirePermission('cases', <verb>)`.
  - **Problem (real):** Case creation fields (`client_name`, `case_type`, `case_category`, `court_name`) do NOT match the `CaseData` interface the UI reads (`case_type`, `case_category`, `court_name`, `priority`, `assigned_to`, `customer_id`, `internal_notes`). Several UI-expected columns (`priority`, `assigned_to`, `customer_id`, `internal_notes`) are in `ALLOWED_CASE_COLUMNS` but never written by `POST`. No `cases` table seed of `priority`/`assigned_to`.

- **File:** `app/api/admin/cases/events/route.ts`
  - **Responsibilities (real):** ✔ `POST` inserts a `case_events` row (`case_id`, `event_type`, `title`, `description`, `author`) and bumps the parent case `updated_at`. ✔ `DELETE` removes an event by id. ✔ Auth via Clerk `auth()` only (NO `requirePermission`).
  - **Problem (real):** Authorization inconsistent with the parent cases route — uses raw `auth()` instead of `requirePermission('cases', ...)`. No validation that `case_id` exists.

- **File:** `app/api/admin/cases/documents/route.ts`
  - **Responsibilities (real):** ✔ `POST` inserts a `case_documents` row (`case_id`, `file_name`, `file_size`, `file_type`, `file_url`, `uploaded_by`) and bumps case `updated_at`. ✔ `DELETE` removes by id. ✔ Clerk `auth()` only.
  - **Problem (real):** Stores only metadata (`file_url`, `file_name`); there is NO file-upload/storage handler — the URL is expected to be supplied by the caller. No `requirePermission`. The UI's drag-and-drop zone has no wired upload action (see page).

- **File:** `app/api/admin/cases/tasks/route.ts`
  - **Responsibilities (real):** ✔ `POST` inserts a `case_tasks` row (`case_id`, `title`, `assignee`, `status`, `due_date`) and bumps case `updated_at`. ✔ `PUT` uses `buildSafeUpdate` over `ALLOWED_TASK_COLUMNS` (5 cols) and appends `status` override. ✔ `DELETE` by id. ✔ Clerk `auth()` only.
  - **Problem (real):** Same auth inconsistency (`auth()` not `requirePermission`). Tasks are a sub-resource but have their own allowlist; lifecycle (status transitions) not enforced.

- **File:** `app/admin/cases/[id]/page.tsx`
  - **Responsibilities (real):** ✔ Case detail UI: fetches `/api/admin/cases?id=` (case + events + documents + tasks); three tabs (timeline/documents/tasks); toggles case open/closed via `PUT`; toggles task completed/pending via `PUT` to tasks route; renders client initials avatar, metadata sidebar, close/reopen button. ✔ Drag-and-drop document zone is presentational only (`onDrop` just `preventDefault`) — no upload wired.
  - **Problem (real):** The documents tab's drop zone does nothing (no POST to `cases/documents` exists in the UI) — documents can only be listed, not added from this page. Timeline events are rendered from `case_events` but there is no UI to create events either (only tasks and status are actionable). Implies events/documents are written elsewhere or are dead surfaces.

## Module-level real responsibilities
- ✔ Case CRUD (admin) with soft status (`open`/`closed`), auto `case_number`, `closed_at`.
- ✔ Sub-resources: case events, case documents (metadata only), case tasks — each with own route, all linked to a parent case and bumping `updated_at`.
- ✔ Aggregated listing counts (`event_count`/`document_count`/`pending_tasks`).

## Proposed split (target per Blueprint domains/packages)
- `packages/domains/cases` — `CaseService`, `CaseRepository`, `CaseValidator` (fix POST to write `priority`/`assigned_to`/`customer_id`/`internal_notes` the UI expects).
- `packages/domains/cases/events` — `CaseEventService`/`Repository` (+ a real `createEvent` UI action; today only API exists).
- `packages/domains/cases/documents` — `CaseDocumentService` with actual file storage/upload (replace URL-only), + wire the UI drop zone.
- `packages/domains/cases/tasks` — `CaseTaskService`/`Repository` with enforced status lifecycle.
- `packages/infra/auth` — unify authorization: events/documents/tasks routes should use `requirePermission('cases', ...)` like the parent route.
- `packages/domains/identity` — `customer_id`/`assigned_to` should reference real entities, not free-text.

## Dependency observations (real)
- Parent `app/api/admin/cases/route.ts` imports: `next/server`, `@/lib/db` (`getDb`, `buildSafeUpdate`), `@/lib/admin/permissions` (`requirePermission`).
- Sub-routes (`events`/`documents`/`tasks`) import: `next/server`, `@/lib/db` (`getDb` and `buildSafeUpdate` for tasks only), `@/clerk/nextjs/server` (`auth`) — notably they do NOT import `requirePermission`, the divergence in auth model.
- UI `app/admin/cases/[id]/page.tsx` imports: `useI18n`, `adminFetch`. It depends on `use(params)` (Next.js dynamic route param promise) and calls the four case endpoints.
- Cases reference `customer_id`/`assigned_to` columns but no FK or join is performed in any observed route; the `CaseData`/`CaseEvent`/`CaseDocument`/`CaseTask` interfaces are declared in the page file only.
