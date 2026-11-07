# Platform Blueprint (Epic 2A)

> **Architecture only. No code changes.** This folder is the master plan for transforming the
> current Next.js monolith (`PLATFORM_DISCOVERY.md`) into the LocalPlug Business Platform.
> Every document here is a contract for **Epic 2C (Platform Refactoring)**.
>
> **Status: Epic 2A (Blueprint) APPROVED** — it is the architectural source of truth.
> The **Migration Execution Plan (9 docs below) is COMPLETE** and proves the migration is
> executable, incremental, and reversible.
> **Next: Epic 2B (Platform Digital Twin)** — document the *real* current system first.
> Epic 2C (Refactoring) remains **blocked** until the Digital Twin exists and the plan is
> revalidated against it.

## Guiding principle (new rule)
> We do **not** refactor because code is duplicated.
> We refactor because **ownership is incorrect**.
> The objective is **correct business boundaries**, not cleaner code.

## Deliverables (this folder)
| Doc | Answers |
|---|---|
| `DOMAIN_MAP.md` | What each business domain owns (responsibility, entities, events) |
| `PACKAGE_MAP.md` | What each cross-cutting package owns and exposes |
| `APPLICATION_MAP.md` | What each application (admin/driver/customer/landing) consumes |
| `DATA_OWNERSHIP.md` | Which domain owns which data concept |
| `API_OWNERSHIP.md` | Which domain/app owns which API surface |
| `EVENT_OWNERSHIP.md` | Which domain owns/publishes/consumes which event |
| `DATABASE_OWNERSHIP.md` | Which domain owns which tables + migration ownership |
| `FOLDER_OWNERSHIP.md` | Where every current folder goes |
| `DEPENDENCY_GRAPH.md` | Allowed dependency direction |
| `INTERACTION_DIAGRAM.md` | How modules interact at runtime |
| `CONTEXT_DIAGRAM.md` | Platform context (users, systems, apps) |
| `BOUNDED_CONTEXTS.md` | Bounded contexts and their relationships |
| `SEQUENCE_DIAGRAMS.md` | Sequence diagrams for major workflows |
| `MIGRATION_BACKLOG.md` | Ordered, dependency-based refactor backlog |
| `FILE_CLASSIFICATION.md` | Every existing file → Keep/Move/Split/Merge/Replace/Delete |

## Migration Execution Plan (gate before Epic 2C — no code)
| Doc | Answers |
|---|---|
| `EXECUTION_GUIDE.md` | **Manual de obra**: exact order B0→B29, step-done criteria, checklists, rollback, dependencies, advancement criteria, progress metrics |
| `DEPENDENCY_EXECUTION_MATRIX.md` | Per step (B0–B29): prerequisites, files, domains, APIs, DB impact, risk, rollback, validation, tests |
| `DEPLOYMENT_STRATEGY.md` | Is each step independently deployable? (YES/NO; split if NO; no big-bang) |
| `TESTING_STRATEGY.md` | Per step: unit / integration / e2e / manual / performance |
| `ROLLBACK_STRATEGY.md` | Per step: how to rollback, data affected, max downtime, backward compat, feature flags |
| `RISK_MATRIX.md` | Step × risk / impact / complexity / rollback difficulty |
| `CRITICAL_PATH.md` | Critical Path vs Parallelizable vs Independent vs Optional |
| `FREEZE_RULES.md` | What cannot change during Epic 2C (no features, no UI/schema redesign, no new apps) |
| `SUCCESS_CRITERIA.md` | When Epic 2C is complete |

## Target shape (summary)
```
apps/        admin · driver · customer · landing      (interfaces only)
packages/
  domains/    booking dispatch drivers trips vehicles
              customers payments notifications chat ai
              analytics settings cases hotels ratings moderation maps
  api         db  auth  realtime  config  shared  ui
infra         Turso · Clerk · n8n · Evolution · Coolify · Hetzner
```

## Approval gate
Epic 2C begins only when this Blueprint is reviewed and approved, and after the Platform
Digital Twin (Epic 2B) documents the real system. Driver Portal (Epic 6)
begins only when: domains stable · shared infra exists · admin consumes new domains ·
Platform Refactoring complete.
