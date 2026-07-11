# IMPLEMENTATION_RULES (Epic 2C — Execution Contract)

> **This document governs EVERY step of the Platform Refactoring (Epic 2C).**
> It is the "manual de obra" of the project. No code moves without these rules being true.
> It is the binding contract between the Architecture (Blueprint), the Reality (Digital Twin),
> the Validation (2B.5) and the Execution (2C). Read it before every PR.
>
> Companion docs: `CONSTITUTION.md` §14, `MIGRATION_BACKLOG.md` (4-stage order),
> `architecture-validation/ARCHITECTURE_GATES.md` (when a step is blocked).

## Guiding principle (from Constitution §14)
We refactor because **ownership is incorrect**, not because code is duplicated. Goal = correct
business boundaries, not cleaner code. **Move behavior; never change it.**

---

## The 10 Rules

### Rule 1 — Never move code without tests.
Every step ships with tests for what it moves. No test → no merge. Tests cover the moved
behavior **before** it leaves `app/api` / components. Regression suite (`12-quality/`) must be
green after every step.

### Rule 2 — Never change behavior. Only ownership.
A refactor step must be behavior-preserving. If a step needs a behavior change, it is split:
first move (behavior identical, flag off), then change (separate PR, flag on). "I'll fix it
while moving it" is forbidden.

### Rule 3 — Every PR touches exactly one domain.
A PR may modify one `packages/domains/<domain>` (or one `packages/*` infra). Cross-domain PRs
are rejected at review. This keeps blast radius small and rollback surgical. (Exception:
Foundation steps B0–B7 which set up `packages/*` itself — those are explicitly infra-wide but
behavior-neutral.)

### Rule 4 — Never mix UI with domain.
UI lives in `apps/*`. Domain logic lives in `packages/domains/*`. A PR that puts business logic
in a component, or UI in a domain, fails Rule 3/4. The Design System (`packages/ui`) is config,
not behavior.

### Rule 5 — Every new service lives in a Domain. Never in an API route.
Business logic belongs in `packages/domains/<domain>/services/*`. API routes are thin
orchestrators: validate input → call domain → return envelope. If a route contains an `if` on
business state, it is a violation.

### Rule 6 — Every step must compile. Always.
`next build` + `tsc --noEmit` must pass after every step. A step that does not compile is not
"in progress" — it is broken. CI blocks merge on compile failure.

### Rule 7 — Every step must deploy. Always.
Every step is independently deployable (feature flag / strangler if needed). No step may leave
`main` in a non-deployable state. Production is the only real test of "deployable".

### Rule 8 — Rollback is proven, not assumed.
Every High-Risk step ships with a tested rollback (flip flag, revert migration, restore
deleted file). Rollback is exercised in staging before the step is marked done. Deletions
(e.g. duplicate stores) happen only after the replacement is proven in production.

### Rule 9 — Feature Flag for every High-Risk change.
Any step touching data, auth, payments, or realtime uses a runtime flag (`use-domain-*`,
`use-drizzle`, `use-socketio`). Flag off = old path. Flag on = new path. Both paths compile.
Rollback = flip flag. See `MIGRATION_BACKLOG.md` flag column.

### Rule 10 — Never proceed if a Gate fails.
If `architecture-validation/ARCHITECTURE_GATES.md` for the step is red, the step stops. A red
gate is not "a TODO" — it is a block. Fix the gate, then continue. Skipping a gate voids this
contract.

---

## How the rules map to the stages

| Stage | Steps | What the rules protect |
|---|---|---|
| 0 · Migration Workspace | 2C.0 | Rules 7,8,9 — safe coexistence with prod (branch, flags, dual CI, dashboard) |
| 1 · Foundation | B0, B1, B3, **B5A**, B6, B7 (+Maps/Moderation in B1) → **FOUNDATION CHECKPOINT** | Rules 6,7 — invisible, no behavior change |
| 2 · Core Platform | B4, B8, B9, B10, B11, B12, **B5B** | Rules 2,5,9 — the technical heart; logic leaves routes |
| 3 · Business Domains | B13–B21, B27–B31 | Rules 1,2,3,4 — ownership moves; one domain per PR |
| 4 · Delivery | B22, B23, B24, B25, B32, B33 | Rules 7,8,9,10 — apps consume the platform |

> **Auth split (per decision):** `B5A` = auth **infrastructure** (Clerk, middleware, guards,
> context, in-memory roles) — lives in Foundation, **no Drizzle**. `B5B` = auth **persistence**
> (RBAC, permissions, roles, claims, audit) — lives in Core Platform, **requires B4 (Drizzle)**.
> This removes the Foundation-before-Core dependency conflict.

## The Foundation Checkpoint (mandatory before Core Platform)
After Stage 1, answer **all** before proceeding:
1. Does it compile? (`next build` + `tsc --noEmit`)
2. Does it deploy? (staging deploy green)
3. Did behavior change? (regression suite identical to main)
4. Do all tests pass? (unit + integration green)
5. Do feature flags work? (boot flags toggle paths in staging)
6. Was rollback proven? (flip a flag / revert a migration in staging)

If any answer is "no", the step that broke it is fixed before Core begins. This is Rule 10 in
practice.

## Enforcement
- **Lint boundary guards** (B0) enforce Rules 3,4,5 mechanically: a domain may not import a
  route; a component may not import a domain service directly except via its public API.
- **CI** enforces Rules 1,6,7 (tests + build + deploy check).
- **Review** (CODE_REVIEW_CHECKLIST) enforces Rules 2,8,9,10.
- **Gates** (ARCHITECTURE_GATES) enforce Rule 10 per step.

## Invariants (must hold at the end of 2C)
- 0 business logic in `app/api/*` / components (enforced by lint).
- Every table has exactly one writer (DB ownership matrix clean).
- Every cross-domain change is a typed event (event catalog complete).
- Socket.IO replaces polling (fallback kept) or flag documented.
- All flags removed (or formalized) once the new path is proven in production.
