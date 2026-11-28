# Permissions DB-Driven Plan (LocalPlug)

**Repo:** LocalPlug (Next.js 14 App Router + Turso/LibSQL + Clerk)  
**Working dir:** `/Users/frg/Documents/Innotechlabs/reservaTeam/LocalPlug`  
**Task ID:** task_c1ae76b81b52  
**Role:** Architect  
**Deliverable:** Plan document only — no implementation code changes.  
**Status:** Proposed (awaiting implementation)

---

## 1. Goal

Remove the hardcoded super_admin/admin email bypass so that permissions are fully DB-driven. The super admin configures roles, modules, and the role_permissions matrix via DB/UI. `requireSuperAdmin` must validate the `super_admin` role in the database, not against a hardcoded email list. No hardcoded emails (`BUILTIN_SUPER_ADMINS`, `ADMIN_EMAILS`) as a source of truth. Existing tables preserved (`modules`, `roles`, `role_permissions`, `users`, `user_roles`). Existing `requirePermission(moduleSlug, action)` callers must not break. Super admin must not be able to disable its own role from the DB UI. All enforcement server-side. CRUD actions per module: view/create/update/delete.

---

## 2. Current state (observed)

| File | What it does today | Hardcoded bypass present |
|------|-------------------|--------------------------|
| `lib/admin/permissions.ts` | `BUILTIN_SUPER_ADMINS = ['anthonyrivera51@gmail.com']`; `isSuperAdminEmail`/`isAdminEmail`; `getUserPermissions` auto-promotes by email and grants all perms to `super_admin`/`admin` role names; `requireSuperAdmin` checks email | Yes — email + role-name bypass |
| `app/api/webhooks/clerk/route.ts` | `isAdminEmail(email)` from `ADMIN_EMAILS` env; promotes new/existing users to admin by email | Yes — `ADMIN_EMAILS` |
| `app/api/admin/permissions/route.ts` | `GET`/`PUT`/`POST`/`DELETE` for roles/permissions; `requireSuperAdmin` on mutating ops; `DELETE` protects `['super_admin','admin','viewer']` | Relies on email-based `requireSuperAdmin` |
| `app/api/admin/team/roles/route.ts` | `GET` roles, gated by `requirePermission('roles','view')` | Indirect |
| `app/api/admin/modules/route.ts` | `GET` modules, gated by `requirePermission('roles','view')` | Indirect |
| `app/api/admin/permissions/mine/route.ts` | Returns own permissions + `isSuperAdmin` from `isSuperAdminClerkUser` | Yes — email-based |
| `lib/db/migrate-auto.ts` | `ensureSchema()` seeds `modules`/`roles`/`role_permissions` from hardcoded `DEFAULT_PERMISSIONS` + `RESTRICTED_MODULES` matrix | Yes — hardcoded matrix |
| `middleware.ts` | Portal redirection reads Clerk `privateMetadata.role` (a cache, not enforcement) | Indirect — metadata cache |

Callers of `requirePermission(moduleSlug, action)` (must keep working): `app/api/admin/employees`, `hotels`, `plans`, `cases`, `settings`, `analytics`, `outbox`, `stats`, `hotels/stats`, `admin/hotels`, `payouts/[id]`, `chat/escalate`, `chat/send`, `bookings/driver-assigned`, `bookings/delivery-completed`, `assignments`, `bookings/search`, `realtime-auth`, and several test files that mock `requirePermission`.

Callers of `requireSuperAdmin` / `isSuperAdminClerkUser`: `app/api/admin/permissions/route.ts` (PUT/POST/DELETE), `app/api/admin/ride-pricing/route.ts`, `app/api/admin/permissions/mine/route.ts`.

---

## 3. Decomposition (ordered subtasks)

### Subtask 0 — Baseline & call-site inventory (Architect)
- Grep every reference to `BUILTIN_SUPER_ADMINS`, `isSuperAdminEmail`, `isAdminEmail`, `ADMIN_EMAILS`, `isSuperAdminClerkUser`, `requireSuperAdmin`, `getUserPermissions`, `checkPermission`, `requirePermission`.
- Catalog all `requirePermission(moduleSlug, action)` call sites and their expected behavior (401/403/undefined).
- Catalog all `requireSuperAdmin` call sites.
- Output: inventory doc + decision on bootstrap mechanism for the first super_admin (see Risks).

**Boundary:** read-only. No code changes.

### Subtask 1 — Rework `lib/admin/permissions.ts` (Backend/Next.js API dev)
- Remove `BUILTIN_SUPER_ADMINS`, `isSuperAdminEmail`, `isAdminEmail`.
- `requireSuperAdmin()`: resolve Clerk user → DB user row → role; return 403 unless role name === `'super_admin'` in DB. Keep signature (`Promise<NextResponse | undefined>`).
- `getUserPermissions(clerkId)`: purely DB-driven. Resolve user's role (from `users.role_id`/`user_roles`), look up `role_permissions` matrix joined to `modules`. No auto-promotion by email, no all-perm grant by role name (`super_admin`/`admin`), no hardcoded core-module fallback list.
- `checkPermission(clerkId, moduleSlug, action)`: unchanged signature; driven by DB matrix only.
- `requirePermission(moduleSlug, action)`: unchanged signature and behavior (401 unauth, 403 forbidden, undefined allowed) so all existing callers keep working.

**Boundary:** do NOT change `PermissionAction` type (`view`|`create`|`update`|`delete`) or the `requirePermission`/`checkPermission` signatures.

### Subtask 2 — Rework `lib/db/migrate-auto.ts` (Backend/Next.js API dev)
- `ensureSchema()`: keep creating `modules`, `roles`, `role_permissions` tables idempotently; keep existing tables (`users`, `user_roles`) untouched; no new tables, no dropped tables.
- Seed core roles (`super_admin`, `admin`, `manager`, `concierge`, `viewer`, `hotel_manager`) and the `MODULES` list idempotently (`INSERT OR IGNORE`).
- Remove the hardcoded enforcement matrix (`DEFAULT_PERMISSIONS` + `RESTRICTED_MODULES`) from the auto-migration path. The `role_permissions` matrix is configured via UI, not code. A minimal sample seed is acceptable but must not act as enforcement.
- Keep SQLite dialect (`datetime('now')`, `INSERT OR IGNORE`, `AUTOINCREMENT`).

**Boundary:** do not add/drop/rename tables or columns.

### Subtask 3 — Rework `app/api/webhooks/clerk/route.ts` (Backend/Next.js API dev)
- Remove `isAdminEmail`/`ADMIN_EMAILS` promotion logic.
- On `user.created`/`user.updated`: assign the default role (e.g. `viewer`, resolved from DB by name) instead of admin-by-email. No email-based promotion.
- Keep Svix signature verification and Clerk metadata sync (best-effort, non-critical).

**Boundary:** do not weaken webhook signature verification.

### Subtask 4 — Rework `app/api/admin/permissions/route.ts` (Backend/Next.js API dev)
- `GET`: keep `requirePermission('roles','view')`; return `isSuperAdmin` computed from DB-driven `requireSuperAdmin`-equivalent (non-blocking check).
- `PUT`/`POST`/`DELETE`: keep `requireSuperAdmin()` (now DB-driven).
- `DELETE`: keep protection for core roles; extend so the `super_admin` role cannot be deleted/disabled by anyone, including itself.
- `PUT`: add self-disable guard — a super_admin cannot strip ALL permissions from its own role (the role performing the request must retain at least one permission on the roles module, or the `super_admin` role row cannot be zeroed out). Enforced server-side.

**Boundary:** do not change the `role_id`/`module_id`/`can_*` request contract.

### Subtask 5 — Rework `app/api/admin/team/roles/route.ts` and `app/api/admin/modules/route.ts` (Backend/Next.js API dev)
- Keep `GET` gated by `requirePermission('roles','view')`.
- Ensure role/module reads are purely DB-driven (already are); add guards consistent with Subtask 4 if mutating endpoints are added later.

**Boundary:** read-only surface for now; no new write endpoints unless scoped separately.

### Subtask 6 — Rework `app/api/admin/permissions/mine/route.ts` (Backend/Next.js API dev)
- `isSuperAdmin` computed from DB-driven role check (same logic as Subtask 1), not `isSuperAdminClerkUser` email fallback.
- Keep `getUserPermissions` + `isSuperAdmin` response shape.

### Subtask 7 — Review `middleware.ts` (Backend/Next.js API dev, informational)
- Confirm portal redirection reads Clerk `privateMetadata.role` only as a UI convenience redirect, NOT as enforcement.
- Document that metadata is a potentially stale cache; core enforcement remains in API routes via `requirePermission`/`requireSuperAdmin`.
- No behavioral change required unless the team opts to source the portal role from DB.

**Boundary:** out of scope for enforcement change; note as risk only.

### Subtask 8 — Tests (QA / Backend dev)
Add/update vitest tests under `tests/`:
- `requireSuperAdmin` returns 403 when DB role !== `super_admin`; passes (undefined) when role === `super_admin`.
- `checkPermission`/`getUserPermissions` returns only matrix perms; a user whose role lacks a matrix row gets no perms (no all-perm bypass by role name).
- `requirePermission` behavior preserved (401/403/undefined) — no existing caller breaks.
- Webhook route does not promote by email; new users get default role.
- `DELETE /api/admin/permissions` rejects deleting the `super_admin` role (400).
- `PUT /api/admin/permissions` rejects stripping all permissions from the `super_admin` role (self-disable, 400/403).

**Boundary:** tests mock `getDb` and `@clerk/nextjs/server` per existing convention (`tests/app/api/admin/orders/route.test.ts`).

### Subtask 9 — Verification (Backend dev / QA)
- `pnpm lint` (ESLint) clean.
- `pnpm exec tsc --noEmit` (TypeScript strict) clean.
- `pnpm test` (vitest) green for permissions + affected admin routes.
- `pnpm build` (Next.js) succeeds.

---

## 4. Team (roles and order)

| Order | Role | Responsibility | Parallel? |
|-------|------|----------------|-----------|
| 1 | Architect (this worker) | Plan, inventory, bootstrap decision | — |
| 2 | Backend / Next.js API dev | Subtasks 1–7 (code rework) | Subtasks 1, 2, 3 can start after inventory; 4–6 depend on 1 |
| 3 | QA | Subtask 8 (tests) | After Subtask 1 is stable |
| 4 | Backend dev + QA | Subtask 9 (lint/tsc/tests/build) | After code + tests |
| 5 | Security reviewer (optional) | Validate server-side enforcement, self-disable guard, no client bypass | Parallel with Subtask 9 |

Since this is a plan-only task, no implementation is assigned yet. When implemented, one backend dev can own Subtasks 1–7 sequentially; QA owns Subtask 8; both converge on Subtask 9.

---

## 5. Acceptance criteria (observable, testable — QA-verifiable)

1. **No hardcoded email source of truth:** `BUILTIN_SUPER_ADMINS`, `isSuperAdminEmail`, `isAdminEmail`, and `ADMIN_EMAILS` are removed from runtime enforcement in `lib/admin/permissions.ts` and `app/api/webhooks/clerk/route.ts`. (A single bootstrap seed may reference an email only for initial setup, not runtime.)
2. **`requireSuperAdmin` is DB-driven:** Given a Clerk user whose DB role is `super_admin`, `requireSuperAdmin()` resolves to `undefined` (allowed). Given any other DB role, it returns a 403 response. Verified via unit test with a mocked `getDb`.
3. **Permissions fully DB-driven:** `getUserPermissions`/`checkPermission` return rights solely from the `role_permissions` matrix joined to `modules`. A user with role `admin` but no matrix row receives no permissions — no all-perm grant by role name, no hardcoded core-module fallback.
4. **`requirePermission` contract preserved:** All existing `requirePermission(moduleSlug, action)` callers still return 401 (unauthenticated), 403 (forbidden), or `undefined` (allowed) as before; no route breaks. Verified by existing route tests that mock `requirePermission`.
5. **Super admin cannot disable its own role:** `DELETE /api/admin/permissions?id=<super_admin id>` returns 400. `PUT /api/admin/permissions` that would zero out all permissions on the `super_admin` role is rejected server-side (400/403).
6. **Clerk webhook no email promotion:** New users created via `user.created`/`user.updated` are assigned the default DB role (e.g. `viewer`); no email-based admin promotion. Verified via unit test.
7. **Tables preserved:** `modules`, `roles`, `role_permissions`, `users`, `user_roles` all still exist; no table added, dropped, or renamed. Verified by schema inspection / `ensureSchema` idempotency.
8. **Build & tests green:** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm build` all succeed.

---

## 6. Risks and do-not-touch boundaries

### Risks
- **Chicken-and-egg: first super_admin.** With email-based bypass removed, there is no runtime path to create the first `super_admin`. A bootstrap mechanism (seed + one-time setup flow, or a seed env var used only once) must be decided in Subtask 0. Without it, no user can ever pass `requireSuperAdmin`.
- **Existing users lose admin status.** Users previously promoted by `BUILTIN_SUPER_ADMINS`/`ADMIN_EMAILS` will no longer be treated as admin/super_admin unless their DB role is explicitly set. A data backfill/assignment step may be needed.
- **`user_roles` vs `users.role_id` source of truth.** `getUserPermissions` currently uses `users.role_id`; `user_roles` also exists. The plan must pick one consistent source of truth (or reconcile both) to avoid divergent permissions.
- **Stale Clerk metadata cache.** `middleware.ts` and some code read `privateMetadata.role` from Clerk for portal redirection. After removing email-based promotion, metadata may be stale; it must not be treated as enforcement (server-side DB checks remain authoritative).
- **Empty `role_permissions` matrix regresses access.** If `ensureSchema` stops seeding a default matrix, existing roles/modules may have zero permission rows until configured via UI, causing apparent access loss. Mitigation: sample seed (non-enforcement) + UI config before relying on DB-only perms.
- **Test mocks couple to internals.** Many route tests mock `requirePermission`; changing `permissions.ts` internals is safe as long as the `requirePermission` signature/behavior is unchanged.

### Do-not-touch boundaries
- Do NOT change the `requirePermission(moduleSlug, action)` signature or `PermissionAction` type — dozens of callers and tests depend on it.
- Do NOT add, drop, or rename tables/columns (constraint: keep existing tables only).
- Do NOT enforce permissions in client components, middleware, or Clerk metadata only — all enforcement server-side in API routes.
- Do NOT weaken Svix signature verification in the Clerk webhook.
- Do NOT delete the `super_admin`, `admin`, or `viewer` core roles (already guarded; keep and extend the guard for `super_admin` self-disable).

### Open decision (to be resolved in Subtask 0)
How the initial `super_admin` is bootstrapped without any hardcoded email: options are (a) a one-time setup endpoint that promotes the first signer to `super_admin`, (b) a seed migration that creates a `super_admin` role plus a placeholder user record, or (c) a short-lived bootstrap env var used once then removed. Tradeoffs to document before implementation.

---

## 7. Out of scope
- Creating new DB tables or columns.
- Building the DB/UI screens for configuring roles/modules/matrix (the API surface is planned; the UI pages are a separate feature).
- Changing Clerk authentication itself or the `middleware.ts` matching/matcher config.
- Mobile app changes.
- Production data migration execution (only planned; requires authorization per migration rules).
