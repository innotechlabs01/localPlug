# ARCHITECTURE_HEALTH

> **Architecture KPI dashboard for the 2C migration.** Tracks *platform health*, not just task
> progress. Companion: `MIGRATION_PROGRESS.md` (per-step status), `PLATFORM_EVOLUTION.md` (why).
> Updated on every merged step. Target = the invariant state at the end of 2C.

## Targets (end-of-2C invariants)
| Indicator | Target | Current | Trend |
|---|---|---|---|
| Correct ownership (single writer per concept) | 100% | ~86% (3 conflicts: booking status, trips, vehicles, config-split) | ▲ improving |
| Circular dependencies | 0 | 2 (`queue↔n8n`, `config↔lib/db`) | ▼ breaking |
| Business logic in UI | 0 | partial | ▼ reducing |
| Business logic in API routes | 0 | high (monolith) | ▼ reducing |
| Domain coverage (all domains extracted & owned) | 100% | 0% (start) | ▲ building |
| Typed events (cross-domain via bus, not inline) | 100% | 0% (inline today) | ▲ building |
| Single Source of Truth per table | 100% | ~88% (3 multi-writer) | ▲ improving |
| High-Risk changes behind a feature flag | 100% | n/a (no HR change yet) | ▲ building |
| Proven rollback (flag/migration tested) | 100% | n/a (no HR change yet) | ▲ building |
| Test coverage (domains) | 80%+ | TBD | ▲ building |

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
| After Core | TBD | 0 | med | 0/16 | high | per-step | tested |
| After Domains | TBD | 0 | low | 16/16 | 100% | per-step | tested |
| After Delivery | 100% | 0 | 0 | 16/16 | 100% | per-step | tested |

> This file is a **permanent reference** for the whole migration. Keep it honest: a red KPI is a
> signal to slow down, not to hide.
