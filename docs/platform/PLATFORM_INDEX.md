# PLATFORM_INDEX

> **Single entry point for humans and AIs.**
> This file is a navigation map only. It contains no technical rules.
> Read it first, then follow the reading order below before writing any code.
>
> **Scope:** LocalPlug is a **Business Platform** — a set of reusable domains
> (Booking, Dispatch, Drivers, Trips, Vehicles, Customers, Payments, Notifications, …)
> consumed by multiple applications (Admin, Driver Portal, Customer Portal, Landing, and
> future Analytics / Public API / Partners). The Driver Portal is the *first new application*,
> not the project itself. The first five Epics build the platform; applications come after.

---

## How to use this file

- If you are a **developer**: start here, then open the linked files in order.
- If you are an **AI agent**: load this file first, then load only the files your task requires (prefer `09-ai/` for context). Never implement before reading the Constitution and the relevant domain/workflow/state-machine files.

---

## Reading order (mandatory before implementing)

```
START HERE  →  PLATFORM_INDEX.md  (you are here)

   ↓
(1) 00-CONSTITUTION.md        — non-negotiable platform rules
   ↓
(2) 01-business/              — what the platform does (domains)
   ↓
(3) 02-architecture/          — how it is structured (monorepo, DDD, events)
   ↓
(4) 06-workflows/             — end-to-end business flows
   ↓
(5) 07-state-machines/        — entity lifecycles & status transitions
   ↓
(6) 03-engineering/           — coding, testing, security, quality gates
   ↓
(7) 05-decisions/             — Architecture Decision Records (ADRs)
   ↓
(8) 09-ai/                    — AI context, prompts, architecture & implementation rules
   ↓
(9) 11-product-management/    — backlog, epics, features, sprints, MVP, releases
   ↓
(10) 12-quality/              — checklists every change must pass

   ↓
NOW YOU ARE ALLOWED TO IMPLEMENT CODE
```

---

## Directory map

| Path | What it is | Read when… |
|---|---|---|
| `00-CONSTITUTION.md` | Immutable platform rules | Always, first |
| `README.md` | Overview of the docs repo | Onboarding |
| `01-business/` | Business domains (booking, dispatch, drivers, trips, vehicles, payments, notifications, analytics) | Building/understanding a feature |
| `02-architecture/` | Monorepo, DDD, event-driven, packages, applications, realtime, deployment | Structuring code |
| `02-architecture/blueprint/` | **Epic 2A master plan**: domain/package/app maps, data/api/event/db/folder ownership, dependency + context + bounded-context diagrams, sequence diagrams, file classification, migration backlog (v2, 4-stage order), `IMPLEMENTATION_RULES.md` (2C execution contract) | Defining future architecture (no code) |
| `03-engineering/` | AI rules, coding standards, testing, security, performance, review, quality gates | Writing/ reviewing code |
| `04-operations/` | Infra, Docker, Coolify, monitoring, backup, observability | Deploying/operating |
| `05-decisions/` | ADRs — why we decided what we decided | Questioning a past decision |
| `06-workflows/` | Booking, dispatch, assignment, trip, payment, notification flows | Tracing a use case |
| `07-state-machines/` | Booking, assignment, trip, payment, driver lifecycles | Implementing status transitions |
| `08-ui/` | Design system, UI inventory, UX flows | Building UI |
| `09-ai/` | Master context, prompts, architecture rules, implementation rules | Acting as / instructing an AI |
| `10-reference/` | Glossary, naming, conventions | Looking up a term or rule |
| `11-product-management/` | Backlog, epics, features, stories, sprints, MVP, releases, changelog, decisions | Planning / product strategy |
| `12-quality/` | Review, UX, API, DB, security, performance, pre-release checklists | Gating every change |
| `99-analysis/` | PLATFORM_DISCOVERY (as-is map), CURRENT_ARCHITECTURE (as-is snapshot), PLATFORM_AUDIT, TECH_DEBT, MIGRATION_PLAN, REFACTOR_REPORT, `platform-digital-twin/` (Epic 2B — real-system mirror: files, modules, dependencies, runtime map, matrices), `architecture-validation/` (Epic 2B.5 — audit Blueprint ↔ Twin ↔ Plan B0–B29: backlog/ownership/event/DB/API/realtime/monorepo checks, readiness score, gates) | Gap analysis, current vs target |
| `archive/` | Past spec versions (spec-v1, etc.) — never delete, only move | Historical context |

---

## Golden rules (summary — full text in Constitution)

1. Business rules never depend on frameworks.
2. Applications contain no business logic; domains do.
3. Cross-domain communication happens only through typed events.
4. Every architectural decision is recorded as an ADR.
5. Documentation is migrated, never deleted (`archive/`).
