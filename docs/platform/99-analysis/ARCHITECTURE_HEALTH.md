# ARCHITECTURE_HEALTH

> **Architecture KPI dashboard for the 2C migration.** Tracks *platform health*, not just task
> progress. Companion: `MIGRATION_PROGRESS.md` (per-step status), `PLATFORM_EVOLUTION.md` (why).
> Updated on every merged step. Target = the invariant state at the end of 2C.

## Targets (end-of-2C invariants)
| Indicator | Target | Current | Trend |
|---|---|---|---|
| Correct ownership (single writer per concept) | 100% | ~86% (3 conflicts: booking status, trips, vehicles, config-split) | ▲ improving |
| Circular dependencies | 0 | 1 (`queue↔n8n`) | ▼ breaking |
| Business logic in UI | 0 | partial | ▼ reducing |
| Business logic in API routes | 0 | high (monolith) | ▼ reducing |
| Domain coverage (all domains extracted & owned) | 100% | 0% (start) | ▲ building |
| Typed events (cross-domain via bus, not inline) | 100% | 0% (inline today) | ▲ building |
| Single Source of Truth per table | 100% | ~88% (3 multi-writer) | ▲ improving |
| High-Risk changes behind a feature flag | 100% | 100% (use-drizzle wired, dual runtime) | ✅ B4 |
| Proven rollback (flag/migration tested) | 100% | 100% (flag OFF = instant rollback) | ✅ B4 |
| Test coverage (domains) | 80%+ | TBD | ▲ building |

> **Foundation Checkpoint (≥96%):** at the end of Stage 1, "Architecture Health ≥96%" means the
> *foundation* KPIs are green and the dashboard shows **no regression** — compile/lint/build/tests/
> flags/rollback/boundary-guards/CI all ✔, and ownership/cycle metrics are not worsened. The full
> targets (100% correct ownership, 0 circular dependencies) are **end-of-2C** invariants, reached
> during Core Platform + Business Domains, not at this gate. Do not block Foundation on domain
> ownership; block on foundation health. See `IMPLEMENTATION_RULES.md` → Foundation Checkpoint.

## How each KPI is measured
- **Correct ownership / SSOT:** diff `SOURCE_OF_TRUTH_MATRIX` vs `DATABASE_OWNERSHIP_MATRIX` after
  each step; count concepts/tables with exactly one writer.
- **Circular dependencies:** re-run `platform-digital-twin/DEPENDENCIES/scan-deps.mjs` each stage;
  expect 0 at end of Core Platform.
- **Business logic in UI / API:** lint boundary guard (B0) flags domain imports in components /
  business `if`s in routes; count violations, target 0.
- **Domain coverage:** count `packages/domains/*` present vs the 16 target domains.
- **Typed events:** count cross-domain calls routed through `packages/events` vs inline.
- **Flags / rollback:** every High-Risk step logs its flag + tested-rollback in `MIGRATION_PROGRESS`.

## Snapshot (fill as migration runs)
| Stage | Ownership | Cycles | Logic-in-API | Domains | Typed events | Flags | Rollback |
|---|---|---|---|---|---|---|---|
| Start | 86% | 2 | high | 0/16 | 0% | — | — |
| After Foundation | TBD | 2 | high | 0/16 | 0% | boot flags on | registry |
| After B4 (Database) | ~88% | 1 | high | 0/16 | 0% | use-drizzle | dual runtime |
| After Core | TBD | 0 | med | 0/16 | high | per-step | tested |
| After Domains | TBD | 0 | low | 16/16 | 100% | per-step | tested |
| After Delivery | 100% | 0 | 0 | 16/16 | 100% | per-step | tested |

> This file is a **permanent reference** for the whole migration. Keep it honest: a red KPI is a
> signal to slow down, not to hide.
