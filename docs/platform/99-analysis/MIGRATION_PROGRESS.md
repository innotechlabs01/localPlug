# MIGRATION_PROGRESS (dashboard — Epic 2C)

> Live status of every 2C step. Updated on each merged PR. Companion to `MIGRATION_WORKSPACE.md`
> (prep), `ARCHITECTURE_HEALTH.md` (KPIs), `IMPLEMENTATION_RULES.md` (contract).
> Status: ⬜ pending · 🟡 in progress · 🟢 done · 🔴 blocked.

| Stage | Step | Title | Status | Flag | Gate | Deployed | Notes |
|---|---|---|---|---|---|---|---|
| 0 | 2C.0 | Migration Workspace (branch, flags, CI, dashboard) | 🟢 | — | — | — | branch `migration/platform-v2` + `lib/feature-flags.ts` + `ci-migration.yml` + dashboard |
| 1 | B0 | Tooling (Turbo, pnpm, ESLint boundaries, CI, Prettier, Husky, Commitlint, Changesets) | 🟢 | — | — | — | turbo 2.10.4; pnpm workspace; boundaries(warn); husky+commitlint+changesets; build ✔ |
| 1 | B1 | Shared utilities — primitives only (date, money, string, uuid, env, logger, result, errors, value-objects) | 🟢 | — | — | — | `packages/shared` created; `date` & `string` moved from `lib/` + re-exported (no behavior change); Maps/Moderation intentionally excluded (not primitives) |
| 1 | 🔎 REVIEW | Shared Package Review (post-B1): every util must be truly shared | 🟢 | — | — | — | PASS — all 9 modules generic; no business/domain logic |
| 1 | B3 | Config (runtime boundary: typed env, feature flags, constants, runtime helpers) | 🟢 | — | — | — | `packages/config` created; **config↔db cycle eliminated**: `lib/db.ts` now imports `validateEnv` from `@lp/config`; `@lp/config` has zero project/db imports; `lib/config.ts` re-exports boundary + DB settings from `lib/settings.ts`; `lib/feature-flags.ts` re-exports from `@lp/config` |
| 1 | B5A | Auth infrastructure (Clerk, middleware, guards, ctx, in-memory roles) | 🟢 | — | — | — | `packages/auth` created; Clerk wrappers (clerk.ts), middleware helpers (middleware.ts), API guards (guards.ts), context (context.ts), in-memory roles (roles.ts); re-exported from lib/ for backward compat; **no DB/Drizzle** |
| 1 | B6 | Validation (shared schemas) | ⬜ | — | — | — | |
| 1 | B7 | Types (shared domain types) | ⬜ | — | — | — | |
| 1 | ✅ CHECKPOINT | Foundation gate: compiles? deploys? no behavior change? tests green? flags work? rollback proven? | ⬜ | — | — | — | **mandatory before Core** |
| 2 | B4 | Database (Drizzle) | ⬜ | `use-drizzle` | — | — | |
| 2 | B8 | Repositories | ⬜ | — | — | — | |
| 2 | B9 | Domain-service pattern | ⬜ | — | — | — | |
| 2 | B10 | Event bus + outbox | ⬜ | — | — | — | breaks queue↔n8n |
| 2 | B11 | Notifications | ⬜ | `use-domain-notifications` | — | — | |
| 2 | B12 | Shared API layer | ⬜ | — | — | — | |
| 2 | B5B | Auth persistence (RBAC, perms, roles, claims, audit) | ⬜ | `use-domain-auth` | — | — | needs B4 |
| 3 | B13 | Booking | ⬜ | `use-domain-booking` | — | — | |
| 3 | B14 | Dispatch | ⬜ | `use-domain-dispatch` | — | — | |
| 3 | B15 | Drivers | ⬜ | — | — | — | |
| 3 | B16 | Trips | ⬜ | — | — | — | |
| 3 | B17 | Vehicles | ⬜ | — | — | — | |
| 3 | B18 | Customers | ⬜ | — | — | — | |
| 3 | B19 | Payments | ⬜ | `use-domain-payments` | — | — | delete payment-store |
| 3 | B20 | Analytics | ⬜ | — | — | — | |
| 3 | B21 | Settings | ⬜ | — | — | — | |
| 3 | B27 | Ratings | ⬜ | — | — | — | |
| 3 | B28 | Hotels | ⬜ | — | — | — | |
| 3 | B29 | Chat | ⬜ | — | — | — | |
| 3 | B30 | AI | ⬜ | — | — | — | |
| 3 | B31 | Cases | ⬜ | — | — | — | |
| 4 | B22 | Admin refactor (thin orchestrators) | ⬜ | — | — | — | |
| 4 | B23 | Realtime / Socket.IO | ⬜ | `use-socketio` | — | — | |
| 4 | B24 | Feature-flag registry consolidation | ⬜ | — | — | — | |
| 4 | B25 | Driver Portal (gate met) | ⬜ | — | — | — | first new app |
| 4 | B32 | Customer app | ⬜ | — | — | — | |
| 4 | B33 | Landing app | ⬜ | — | — | — | |
| — | UI | Design System / UI (postponed) | ⬜ | — | — | — | after Stage 3 |

## Legend
- **Flag** = feature flag guarding the step (default OFF; flip in staging after gate + rollback).
- **Gate** = per-step gate in `architecture-validation/ARCHITECTURE_GATES.md` (must be ✔).
- **Deployed** = state in staging/prod (flag OFF = old path, ON = new path).
