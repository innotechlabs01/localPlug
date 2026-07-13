# EXECUTION_GUIDE

> **Manual de obra** for Epic 2C (Platform Refactoring). The Blueprint (`README.md`) defines
> *what* the platform becomes; this guide defines *how* we get there without improvisation.
> No code moves until this guide (and its companion docs) is approved.
>
> Immutable rule (Constitution §14): **we move behavior, we do not change behavior.**

## Exact execution order
Follow `MIGRATION_BACKLOG.md` steps **B0 → B29** in order. A step cannot start until all its
`Depends on` steps are merged and green. The order is dependency-driven, not arbitrary:

```
B0  monorepo + CI + lint boundary guards
B1  packages/shared        B2  packages/ui
B3  packages/config        B4  packages/db (Drizzle)     B5  packages/auth
B6  domains/maps           B7  domains/moderation        B8  domains/ratings
B9  domains/hotels         B10 domains/customers         B11 domains/settings
B12 domains/analytics
B13 domains/booking        B14 domains/drivers           B15 domains/vehicles
B16 domains/payments       B17 domains/notifications     B18 domains/chat
B19 domains/ai             B20 domains/dispatch          B21 domains/trips
B22 domains/cases
B23 packages/realtime (Socket.IO)   B24 packages/api
B25 apps/admin (thin routes)        B26 apps/admin/lib
B27 apps/landing  (B28 apps/customer)  ← extractions, no new features
B29 apps/driver  ← FIRST NEW APP (gate)
```

## Per-step completion criteria
A step is **DONE** only when **all** are true:
- [ ] All files in `FILE_CLASSIFICATION.md` for this step are in their target location/state.
- [ ] No business logic remains in the moved route/component (verified by code review).
- [ ] Dependency rules (Constitution §3, `DEPENDENCY_GRAPH.md`) pass the lint guard.
- [ ] Unit + integration tests for the step are green (`TESTING_STRATEGY.md`).
- [ ] Existing functionality verified unchanged (manual + e2e where applicable).
- [ ] Rollback path documented and dry-run or rehearsed (`ROLLBACK_STRATEGY.md`).
- [ ] Docs updated (domain README / architecture note) if the boundary changed.

## Validation checklist (every step)
- [ ] `pnpm lint` + boundary lint guard pass.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test` (vitest) passes.
- [ ] No new `app/api/*` handler contains SQL or domain rules.
- [ ] No `lib/db` import from a client component.
- [ ] Feature flag removed if it was temporary.

## Dependencies between steps
See `DEPENDENCY_EXECUTION_MATRIX.md` (per-step Prerequisites) and `CRITICAL_PATH.md`
(classification). Foundations (B0–B5) block everything; leaf domains (B6–B12) are
parallelizable; core domains (B13–B22) depend on foundations + some leaves; realtime/api
(B23–B24) precede admin (B25–B26).

## Advancement criteria (move to next step)
Promote a step's PR only when the completion criteria + validation checklist are met and the
reviewer confirms **no behavior change** (Constitution §14). If a user-visible difference is
found, it is a **regression** and must be fixed or explicitly planned as a separate, approved
change — never silently merged.

## Rollback
Every step has a rollback class (see `ROLLBACK_STRATEGY.md`): **Easy** (additive, revert PR) ·
**Medium** (flag off / revert + run back-migration) · **Hard** (data reshape). Steps marked
Hard must ship behind a feature flag and include a rehearsed back-migration. No step is
merged if its rollback is unknown.

## Progress metrics
| Metric | Formula | Target |
|---|---|---|
| Migration completion | done steps / 30 | 100% at end of 2C |
| Domains stabilized | domains with logic extracted / 17 | 17/17 before B29 |
| Shared infra present | `db`+`auth`+`realtime`+`api` exist & enforced | yes before B25 |
| Tech debt eliminated | TECH_DEBT items closed / total | all C+H before B29 |
| Regression rate | behavior regressions per step | 0 |
| Boundary violations | lint-guard failures in CI | 0 |

Track these in `DECISION_LOG.md` / sprint notes. The migration is "executable" when this
guide, the matrix, and the strategies are approved; it is "done" when all metrics hit target
and `SUCCESS_CRITERIA.md` is met.
