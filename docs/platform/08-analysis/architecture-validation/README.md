# Architecture Validation (Epic 2B.5)

> **No code. Pure audit.** This folder validates that the architecture is *executable* before
> any refactoring. It cross-checks the three sources of truth:
>
> 1. **Blueprint** (`../02-architecture/blueprint/`) — the *target*.
> 2. **Digital Twin** (`../platform-digital-twin/`) — the *real current* system.
> 3. **Migration Plan** (`../02-architecture/blueprint/` B0–B29) — the *path*.
>
> If these three disagree, or a step is ambiguous, that is a defect to fix **here**, not in 2C.

## What this epic is NOT
- It does **not** add descriptive architecture docs.
- It does **not** change the Blueprint or the Twin.
- It only **validates, scores, and gates**.

## The 9 validations
| # | Validation | Doc | Answers |
|---|---|---|---|
| 1 | Migration Backlog | `MIGRATION_BACKLOG_VALIDATION.md` | Each B0–B29 step: files / domain / tables / APIs / events / tests / rollback / flag / risk / done-criteria — no ambiguity |
| 2 | Ownership | `OWNERSHIP_VALIDATION.md` | For each concept: who may modify; conflict check |
| 3 | Events | `EVENT_TRACEABILITY.md` | Each event: producer → consumer chain; orphan / implicit-dep check |
| 4 | Database | `DATABASE_OWNERSHIP_MATRIX.md` | Table → owner / read / write; multi-writer check |
| 5 | API | `API_VALIDATION.md` | Each endpoint: owner / domain / use case / input / output / perms / events / tables |
| 6 | Realtime | `REALTIME_VALIDATION.md` | Where Socket.IO appears; what stays HTTP |
| 7 | Monorepo | `MONOREPO_DECISION.md` | package vs app rule, applied to every planned unit |
| 8 | Readiness | `REFRACTOR_READINESS.md` | Scorecard vs 95% threshold |
| 9 | Gates | `ARCHITECTURE_GATES.md` | All gates green before 2C |

## Exit criterion
`ARCHITECTURE_GATES.md` shows all gates ✔ (or their open items are explicitly accepted as 2C
work) **and** `REFRACTOR_READINESS.md` ≥ 95%. Only then does Epic 2C start.

## Inputs already produced (reused, not rewritten)
- `platform-digital-twin/DEPENDENCIES/DEPENDENCY_GRAPH.md` — real graph + 2 cycles
- `platform-digital-twin/SOURCE_OF_TRUTH_MATRIX.md` — single-source map
- `platform-digital-twin/INTERACTION_MATRIX.md` — D vs B dependencies
- `platform-digital-twin/EVENTS.md`, `DATABASE/DATABASE.md`, `APIS/APIS.md`, `WEBSOCKETS.md`
- `blueprint/DEPENDENCY_EXECUTION_MATRIX.md`, `MIGRATION_BACKLOG.md`, `FILE_CLASSIFICATION.md`
