# Auth (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `middleware.ts`
  - **Responsibilities (real):**
    - ✔ `clerkMiddleware` wrapper; `OPTIONS` → CORS preflight; applies `applyRateLimit` to all `/api/**`; enforces 1MB body limit on mutating requests.
    - ✔ `isPublicRoute` matcher (home, booking, payments, flights, webhooks, admin/lookup, chat start/send/rating/request-escalate/close, ratings, hotels, promotions/validate, config, health, cron, assignments).
    - ✔ `isAdminApiRoute` matcher (`/api/admin/**`, `/api/chat/messages`, `/api/chat/conversations`, `/api/chat/agents`, `/api/chat/escalate`) → requires `auth().userId` (401 if missing), then `NextResponse.next()` (does NOT check role/permission here).
    - ✔ `isLookupRoute` → always `next()`.
    - ✔ Non-public, non-admin routes → `auth.protect()`.
    - ✔ `corsHeaders(req)` builds CORS from `NEXT_PUBLIC_SITE_URL` + fixed Vercel/localhost origins.
  - **Problem (real):** Middleware only does coarse route gating (authenticated vs public). Fine-grained role/permission checks are NOT done here — they are reimplemented per-route, leading to duplication. Admin API routes get "authenticated" only; the actual role/permission decision is scattered across `lib/admin/*`.

- **File:** `lib/admin/auth.ts`
  - **Responsibilities (real):**
    - ✔ `RoleName = 'admin' | 'manager' | 'concierge' | 'viewer'`.
    - ✔ `autoRegisterUser(clerkId)` — inserts a `viewer` user if absent (INSERT OR IGNORE), links `user_roles`.
    - ✔ `requireRole(allowedRoles)` — `auth()`, resolves `users`+`roles` by `clerk_id` (active), auto-registers if missing, returns 401/403/500 `NextResponse` on failure (or `undefined` on success).
  - **Problem (real):** `requireRole` returns a `NextResponse` (error) or `undefined` (ok) — a dual-purpose return that callers must null-check. It auto-registers users as `viewer` as a side effect, coupling auth with user provisioning. It does not cover `hotel_manager` (that lives in `hotel-auth.ts`).

- **File:** `lib/admin/permissions.ts`
  - **Responsibilities (real):**
    - ✔ `getUserPermissions(clerkId)` — resolves user + role; auto-registers as `viewer` if missing (also writes Clerk `public_metadata.role`); `admin` → all modules full perms; others → reads `role_permissions` JOIN `modules`.
    - ✔ `checkPermission(clerkId, moduleSlug, action)` → boolean.
    - ✔ `requirePermission(moduleSlug, action)` — `auth()` then `checkPermission`; returns 401/403 `NextResponse` or `undefined`.
    - ✔ `PermissionAction = 'view'|'create'|'update'|'delete'`; `ModulePermissions` typed map.
  - **Problem (real):** `getUserPermissions` duplicates the `autoRegisterUser`/viewer-provisioning logic already in `auth.ts` (two auto-registration implementations with slightly different Clerk-metadata handling). `requirePermission` re-calls `auth()` independently from `requireRole`, so a route using both double-fetches Clerk. Permission model is module×action only (no hotel/tenant scoping).

- **File:** `lib/admin/hotel-auth.ts`
  - **Responsibilities (real):**
    - ✔ `resolveHotelContext()` — `auth()`, resolves `users`+`roles` by `clerk_id`; `admin` → `{hotelId:null, isAdmin:true}`; `hotel_manager` → its `hotel_id` (403 if none); others → 403.
    - ✔ `requireHotelAccess(hotelId)` — ensures admin or manager of that hotel.
  - **Problem (real):** Yet another copy of the `auth()` → `users` by `clerk_id` → `roles` resolution pattern (third implementation). Hotel/tenant scoping lives here, separate from `permissions.ts`, so "can this user do X on hotel Y" requires calling two different helpers.

- **File:** `lib/webhook-auth.ts`
  - **Responsibilities (real):**
    - ✔ `verifyWebhookSecret(req)` — if `WEBHOOK_SECRET` unset, **allows the request** (warn only); else checks `Authorization: Bearer` or `x-webhook-secret` header equals the secret.
    - ✔ `requireWebhookAuth(req)` — returns 403 `NextResponse` or null.
    - ✔ Secret source: `N8N_WEBHOOK_SECRET || CLERK_WEBHOOK_SECRET`.
  - **Problem (real):** This generic helper is **NOT used** by the actual webhook routes — `app/api/webhooks/evolution` and `app/api/webhooks/n8n` each do their own `timingSafeEqual` signature check against their own env var (`EVOLUTION_WEBHOOK_SECRET` / `N8N_WEBHOOK_SECRET`), and `clerk` webhook uses Svix. So `webhook-auth.ts` is effectively dead/duplicate code with a weaker default (allow-when-unconfigured).

- **File:** `app/api/webhooks/clerk/route.ts`
  - **Responsibilities (real):** ✔ `POST` — verifies Svix signature (`svix-id/timestamp/signature` + `CLERK_WEBHOOK_SECRET`); on `user.created`/`user.updated` creates/updates local `users` as `viewer` (sets Clerk `public_metadata.role`); on `user.deleted` sets `status='inactive'`.
  - **Problem (real):** User provisioning from Clerk is implemented here AND in `auth.ts`/`permissions.ts` (auto-register) — four places that can create a `viewer` user. The webhook and the lazy auto-register can race/diverge.

- **File:** `app/api/admin/permissions/route.ts`
  - **Responsibilities (real):** ✔ `GET` (requirePermission `roles` view) lists roles/modules/`role_permissions` matrix; ✔ `PUT` (requirePermission `roles` update) upserts a `role_permissions` row.
  - **Problem (real):** Permissible; note it trusts `requirePermission` but the route is also gated by middleware's admin-route auth.

- **File:** `app/api/admin/permissions/mine/route.ts`
  - **Responsibilities (real):** ✔ `GET` — `auth()` then `getUserPermissions(clerkId)`; returns the caller's `permissions` map.
  - **Problem (real):** Calls `auth()` then `getUserPermissions` (which calls `auth()` indirectly via `ensureSchema` only — actually it takes `clerkId` param, so no double auth here). Fine.

- **File:** `app/api/admin/modules/route.ts`
  - **Responsibilities (real):** ✔ `GET` — `requirePermission('roles','view')` then lists `modules`.
  - **Problem (real):** None beyond the shared pattern.

- **File:** `app/api/admin/team/route.ts`
  - **Responsibilities (real):** ✔ `GET` (requirePermission `employees` view) lists users with roles + order counts; ✔ `POST` (requirePermission `employees` create) creates a user + `user_roles` link.
  - **Problem (real):** Team-member creation duplicates the user-insert logic seen in `clerk` webhook and auto-register helpers.

- **File:** `app/api/admin/team/roles/route.ts`
  - **Responsibilities (real):** ✔ `GET` — `auth()` then lists `roles` (hardcoded fallback list on error).
  - **Problem (real):** Hardcoded fallback roles (admin/manager/concierge/viewer) can mask a missing `roles` table; minor.

- **File:** `app/api/admin/users/hotel-assign/route.ts`
  - **Responsibilities (real):** ✔ `PUT` (requirePermission `hotels` update) assigns/unassigns a user's `hotel_id`; ✔ `GET` (requirePermission `hotels` view) returns the manager for a hotel.
  - **Problem (real):** Hotel assignment lives here while hotel-scoped access decisions live in `hotel-auth.ts` — two cooperating but separate modules.

- **File:** `app/api/admin/employees/route.ts`
  - **Responsibilities (real):** ✔ `GET/POST/PUT/DELETE` for employees, each guarded by `requirePermission('employees', action)`; `PUT` uses `buildSafeUpdate` with `ALLOWED_EMPLOYEE_COLUMNS`; `POST` logs to `employee_activity`.
  - **Problem (real):** Employee CRUD is a near-duplicate of `team` route (both create users with `role_id`); employee vs team vs user management are three overlapping concepts.

## Module-level real responsibilities

- ✔ Clerk session gating at the edge (`middleware.ts`) — coarse public/admin/protected routing only.
- ✔ Role resolution + lazy `viewer` auto-registration (in `auth.ts`, `permissions.ts`, and `clerk` webhook).
- ✔ Module×action permission checks (`permissions.ts`).
- ✔ Hotel/tenant scoping (`hotel-auth.ts`).
- ✔ Webhook signature verification — THREE different implementations (Svix for Clerk, `timingSafeEqual` for Evolution & n8n; plus the unused `webhook-auth.ts`).
- ✔ Admin user/team/employee/role/hotel-assignment management routes.

## Proposed split (target per Blueprint domains/packages)

- `packages/infra/auth` → a single `AuthGateway` wrapping Clerk: `resolveInternalUser(clerkId)` (one place, no duplicate auto-register), `requireRole`, `requirePermission`, `resolveHotelContext` — consolidating `auth.ts` + `permissions.ts` + `hotel-auth.ts`.
- `packages/infra/auth` → `WebhookVerifier` with per-source strategies (Svix/Clerk, HMAC/Evolution, HMAC/n8n) replacing the three inline verifiers and the unused `webhook-auth.ts`.
- `packages/domains/identity` → user/team/employee/role management as real services (consolidate `team`, `employees`, `users/hotel-assign`, `clerk` webhook provisioning) so there is ONE user-provisioning path.
- `packages/domains/permissions` → the module×action + hotel-scoped permission model as a repository + policy evaluator.

## Dependency observations (real)

- Auth has **no circular dependency**. Its dominant problem is **duplication of the Clerk→internal-user→role resolution**: it appears in `auth.ts` (`requireRole`), `permissions.ts` (`getUserPermissions`), `hotel-auth.ts` (`resolveHotelContext`), and inline in multiple chat/admin routes (`escalate`, `conversations`, `messages`, `agents`, `close`, `agent-me`). Each also re-implements `viewer` auto-registration differently.
- Webhook auth is fragmented: `webhook-auth.ts` is effectively dead code (the real webhooks use their own `timingSafeEqual`/Svix checks), and its default "allow when unconfigured" is a weaker policy than the per-route checks.
- Middleware does only coarse gating; fine-grained permission/hotel checks are pushed into every route, which is why the duplication proliferates. Centralizing `requirePermission`/`resolveHotelContext` in `packages/infra/auth` would remove the per-route `auth()` + `role_id` lookups.
