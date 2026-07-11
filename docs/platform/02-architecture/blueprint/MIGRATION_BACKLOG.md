# MIGRATION_BACKLOG (v2 — 4-stage execution order)

> **Execution contract for Epic 2C.** Ordered in **4 stages** (approved order):
> **Foundation → Core Platform → Business Domains → Delivery.** UI work (old B2) is
> **postponed** until the platform core is consolidated. Every step is governed by
> `IMPLEMENTATION_RULES.md` and must pass `architecture-validation/ARCHITECTURE_GATES.md`.
>
> **Dependency principle:** foundations before consumers; leaf domains before core domains;
> realtime + api contract before admin; admin before driver. A step cannot start until its
> `Depends on` are merged.

## Legend
- **ID** = canonical step id (this v2). **Legacy** = id in the pre-2B.5 backlog, for tracing the
  validation / execution-matrix docs.
- **UI** (old B2, `packages/ui`) is **explicitly postponed** — not in any stage below. It starts
  only after Stage 3 (Business Domains) is stable.

---

## Stage 0 — Migration Workspace (prep, no logic moves)
| # | ID | Title | Type | Depends on | Legacy | Outcome |
|---|---|---|---|---|---|---|
| 0 | 2C.0 | Migration workspace: `migration/platform-v2` branch, flag registry + boot flags, branch policy, dual CI, progress dashboard | Setup | — | — | Safe coexistence with prod; `MIGRATION_WORKSPACE.md` |

## Stage 1 — Foundation (invisible, no behavior change)
> **Mandatory checkpoint after this stage** (before Core): compiles? deploys? no behavior change?
> tests green? flags work? rollback proven? → see `MIGRATION_PROGRESS.md` Foundation row.

| # | ID | Title | Type | Depends on | Legacy | Outcome |
|---|---|---|---|---|---|---|
| 1 | B0 | Monorepo (Turborepo + pnpm) + ESLint boundaries + CI + Prettier + Husky + Commitlint + Changesets | Move | 2C.0 | B0 | `packages/*` exist; lint enforces ownership rules (Rules 3,4,5) |
| 2 | B1 | `packages/shared` (utils, i18n, resilience) **+ absorb Maps (geocode) & Moderation (comment-filter) as stateless libs** | Move | B0 | B1, B6, B7 | Stateless utilities extracted; geo + filter are libs, not domains |
| 3 | B3 | `packages/config` (env/settings; merge `pricing.ts`; split static vs runtime) | Move/Merge | B1 | B3 | Single config source (TECH_DEBT M-1) |
| 4 | B5A | `packages/auth` **infrastructure** (Clerk, middleware, guards, context, in-memory roles) — **no Drizzle** | Move | B1 | B5(part) | Auth bootstrap without DB persistence (TECH_DEBT H-5 part 1) |
| 5 | B6 | `packages/validation` (shared zod / input schemas) | New | B1 | — | One input-validation layer for all domains/routes |
| 6 | B7 | `packages/types` (shared domain TS types / interfaces) | New | B1 | — | Shared contracts; ends implicit `any` across domains |
| 7 | ✅ | **FOUNDATION CHECKPOINT** — gate before Core Platform | Gate | B0–B7 | — | Confirms compile/deploy/no-change/tests/flags/rollback |

## Stage 2 — Core Platform (the technical heart; logic leaves routes)
| # | ID | Title | Type | Depends on | Legacy | Outcome |
|---|---|---|---|---|---|---|
| 7 | B4 | `packages/db` (Drizzle client, consolidate migrations, fold `migrate-auto`) | Replace/Merge | B1 | B4 | ADR-003 implemented (TECH_DEBT C-3, M-3) |
| 8 | B8 | `packages/domains/_repositories` (generic repo layer over Drizzle) | New | B4 | — | Domains read/write only via repositories |
| 9 | B9 | `packages/domains/_services` (base domain-service pattern) | New | B8 | — | Standard service shape; logic moves here, not routes |
| 10 | B10 | `packages/events` (typed event bus + outbox) | New | B1,B4 | B23(catalog) | Typed events replace inline n8n/DB side-effects (breaks `queue↔n8n` cycle) |
| 11 | B11 | `domains/notifications` (Split whatsapp-service + n8n client + templating; centralize i18n) | Split | B1,B4,B5,B10 | B17 | Notifications owned (TECH_DEBT H-6) |
| 12 | B12 | `packages/api` (response/error envelope, route guard, webhook-auth, admin-fetch) | Move | B5,B10 | B24 | Shared API contract for every route |
| 13 | B5B | `packages/auth` **persistence** (RBAC, permissions, roles, claims, audit) — **needs Drizzle (B4)** | Move/Merge | B4,B5A | B5(part) | Single auth + RBAC on domains (TECH_DEBT H-5 part 2) |

## Stage 3 — Business Domains (move ownership — one domain per PR)
| # | ID | Title | Type | Depends on | Legacy | Outcome |
|---|---|---|---|---|---|---|
| 13 | B13 | `domains/booking` (Split booking-service, reservations-types, trm, flight validation) | Split | B4,B3,B9,B10,B28 | B13 | Booking logic out of routes (TECH_DEBT H-3,M-2) |
| 14 | B14 | `domains/dispatch` (Move availability; Split assignment routes) | Split | B13,B15,B17 | B20 | Dispatch owned (TECH_DEBT H-2) |
| 15 | B15 | `domains/drivers` (drivers + compliance + documents) | Move | B4,B5 | B14 | Drivers owned |
| 16 | B16 | `domains/trips` (derive from orders+assignments) | Split | B14,B13,B19 | B21 | Explicit trip concept (TECH_DEBT M-8) |
| 17 | B17 | `domains/vehicles` (extract from `drivers`) | Split | B15,B4 | B15 | Vehicles separate aggregate (TECH_DEBT M-7) |
| 18 | B18 | `domains/customers` | Move | B4,B5 | B10 | Customers owned |
| 19 | B19 | `domains/payments` (Merge paddle + payment-record; **Delete** `payment-store.ts` dup) | Merge/Delete | B4,B13 | B16 | Single payments owner (TECH_DEBT H-1,C-5) |
| 20 | B20 | `domains/analytics` (read models) | Move | B4 | B12 | Analytics read-only |
| 21 | B21 | `domains/settings` | Move | B3,B4 | B11 | Settings owned |
| 22 | B27 | `domains/ratings` (Split UI↔logic) | Split | B1,B4 | B8 | Ratings owned |
| 23 | B28 | `domains/hotels` (hotels/rooms/promotions) | Move | B4 | B9 | Hotels owned |
| 24 | B29 | `domains/chat` (Split chat/agent services + conversation) | Split | B4,B11,B7 | B18 | Chat owned |
| 25 | B30 | `domains/ai` (ollama-service) | Move | B29,B11 | B19 | Concierge engine owned |
| 26 | B31 | `domains/cases` (cases/tasks/documents) | Move | B15,B5 | B22 | Cases owned |

## Stage 4 — Delivery (apps consume the platform)
| # | ID | Title | Type | Depends on | Legacy | Outcome |
|---|---|---|---|---|---|---|
| 27 | B22 | `apps/admin` (Move pages; Split API routes → thin orchestrators) | Move/Split | B13–B21,B27–B31,B12 | B25,B26 | Admin consumes domains (TECH_DEBT M-4) |
| 28 | B23 | `packages/realtime` (Move queue/worker; **Replace** polling with Socket.IO) | Move/Replace | B11,B1,B10 | B23 | ADR-004 implemented (TECH_DEBT C-4) |
| 29 | B24 | Feature-flags consolidation (single flag registry + admin toggle) | New | B12 | B24(part) | All `use-*` flags in one place; verifiable rollback |
| 30 | B25 | `apps/driver` (**NEW** — first new app, gate met) | New | B15,B14,B16,B19,B11,B23,B5 | B29 | Driver Portal — first validating consumer |
| 31 | B32 | `apps/customer` (Move booking UI; Split) | Move/Split | B13,B7,B19 | B28 | Customer app extracted |
| 32 | B33 | `apps/landing` (Move page.tsx + sections + hooks) | Move | B7 | B27 | Landing extracted (no new features) |

## Postponed (not in any stage — starts after Stage 3)
- **UI / Design System** (old B2, `packages/ui`): postponed per decision. Builds only after the
  platform core is consolidated.
- **Ratings UI, Pages, Layouts, Driver Portal UI**: same — depend on stable domains.

---

## Execution rules
- Process strictly stage-by-stage; within a stage, by `#` order. A step cannot start until its
  `Depends on` are merged (flags allow parallel landing, not parallel *behavior*).
- Every step is a PR that keeps the app deployable (feature flag / strangler).
- After each step: run regression suite (`12-quality/`) + the step's gate in
  `architecture-validation/ARCHITECTURE_GATES.md`.
- `Delete` actions (B19 `payment-store.ts`) only after the replacement is proven in production.
- **`IMPLEMENTATION_RULES.md` is mandatory reading before every PR.** Rule 10: a red gate blocks.

## Traceability
The validation docs in `architecture-validation/` were written against the pre-2B.5 IDs. Use this
map (new ID ← legacy):
`2C.0←— (prep) · B0←B0 · B1←B1/B6/B7 · B3←B3 · B4←B4 · B5←B5A+B5B · B5A←B5(part,infra) · B5B←B5(part,persistence) · B6←new · B7←new · B8←new · B9←new · B10←B23(catalog) · B11←B17 · B12←B24 · B13←B13 · B14←B20 · B15←B14 · B16←B21 · B17←B15 · B18←B10 · B19←B16 · B20←B12 · B21←B11 · B22←B25/B26 · B23←B23 · B24←new · B25←B29 · B27←B8 · B28←B9 · B29←B18 · B30←B19 · B31←B22 · B32←B28 · B33←B27`.
