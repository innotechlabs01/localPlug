# Product Backlog

> Master backlog for the **LocalPlug Business Platform**. Single source of truth for planned
> work. Populated by the **Platform Discovery** (`../99-analysis/PLATFORM_DISCOVERY.md`) and
> the **Platform Audit** (`../99-analysis/PLATFORM_AUDIT.md`), refined into
> Epics → Features → Stories → Tasks.
>
> **Status:** Active. The reframe is complete: the project is the *platform*, not the Driver
> Portal. No new product features are built until Epics 1–5 (platform foundation) land.

## The shift
We are not "building the Driver Portal." We are **transforming LocalPlug into a Business
Platform** — a set of reusable domains consumed by multiple applications (Admin, Driver,
Customer, Landing, future Analytics / Public API / Partners). Driver Portal is the first new
application, not the project.

## Structure
```
Epic → Feature → Story → Task
```

## Epics (see `EPICS.md`)
0. Documentation & Constitution ✅
1. Platform Discovery ✅
2A. Platform Blueprint (architecture only, no code) ▶ approved
2B. Platform Digital Twin (document the real current system — no code)
2B.5. Architecture Validation (audit Blueprint ↔ Twin ↔ Plan B0–B29 — no code)
2C. Platform Refactoring (execute the Blueprint)
3. Business Domains Stabilization
4. Shared Infrastructure
5. Admin Refactoring
6. Driver Portal (first new app — gate)
7. Customer Portal
8. Analytics
9. Public API
10. Platform Optimization

## Prioritization
- Driven by the Constitution (`../00-CONSTITUTION.md`) and ADRs (`05-decisions/`).
- **Sequence: Epic 0 (Constitution) → Epic 1 (Discovery) → Epic 2A (Blueprint, no code) →
  Epic 2B (Digital Twin, no code) → Epic 2B.5 (Architecture Validation, no code) →
  Epic 2C (Refactoring) → Epic 3 (Domains) → Epic 4 (Infra) → Epic 5 (Admin) →
  Epic 6 (Driver Portal, gate).**
- Each item tagged: `epic`, `priority`, `domain`, `status`.

## How to use
1. Discovery done → `../99-analysis/PLATFORM_DISCOVERY.md` exists; run Platform Audit → `../99-analysis/TECH_DEBT.md`.
2. Break Epics into Features (`FEATURES.md`) → Stories (`USER_STORIES.md`).
3. Plan Sprints (`SPRINTS.md`); track via `DECISION_LOG.md` and `CHANGELOG.md`.
4. Every change passes `../12-quality/` checklists.
