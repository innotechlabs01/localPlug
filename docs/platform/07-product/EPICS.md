# Epics

The platform roadmap, reframed: **LocalPlug is a Business Platform**. The first work is
*defining and building the platform*; applications (Driver, Customer, Landing) come after.
Discovery and Blueprint are **no-code** phases; refactoring moves code without adding
features; only then are new apps built.

| # | Epic | Purpose | Status |
|---|---|---|---|
| 0 | **Documentation & Constitution** | `docs/platform/`, Constitution, AI rules, knowledge platform | ✅ Done |
| 1 | **Platform Discovery** | Map the current monolith (`../99-analysis/PLATFORM_DISCOVERY.md`), gaps vs target, `../99-analysis/TECH_DEBT.md` | ✅ Done |
| 2A | **Platform Blueprint** | Architecture only — Domain/Package/App/Folder/Ownership maps, diagrams, sequence diagrams, file classification, migration backlog. **No code changes.** | ✅ Approved (architectural source of truth) |
| 2B | **Platform Digital Twin** | Document the **current** system (no code changes): per-file/module real responsibilities, real dependency graph + circular-dependency detection, runtime map, interaction / ownership / source-of-truth matrices, business capability map. Becomes the source of truth for *what exists today* before any migration. | ✅ Done |
| 2B.5 | **Architecture Validation** | Audit consistency across Blueprint (target) ↔ Digital Twin (real) ↔ Migration Plan. Per-step backlog validation, ownership / event / DB / API / realtime / monorepo checks, readiness score (95.3%) + architecture gates. **No code** — proved the design is executable. | ✅ Done |
| 2C | **Platform Refactoring** | Transform the monolith into the new architecture: prep **2C.0 (Migration Workspace)**, then **4 stages** (Foundation → Core Platform → Business Domains → Delivery) per `02-architecture/blueprint/MIGRATION_BACKLOG.md` v2 + `IMPLEMENTATION_RULES.md`. No new features; every step independently deployable; regression tests pass. Refactor by **ownership**, not duplication. | 🟡 In Progress (2C.0) |
| 3 | **Business Domains Stabilization** | `packages/domains/*` stable and owned (Booking, Dispatch, Drivers, Trips, Vehicles, Customers, Payments, Notifications, Chat, AI, Analytics, Settings, Cases, Hotels, Ratings, Moderation, Maps) | After 2C |
| 4 | **Shared Infrastructure** | `packages/{api,db,auth,realtime,config,shared,ui}`; Drizzle (ADR-003); Socket.IO (ADR-004) | After 2C |
| 5 | **Admin Refactoring** | `admin` becomes a pure consumer of the domains | After 3–4 |
| 6 | **Driver Portal** | First new app on the platform | After 2C + 3 + 4 + 5 |
| 7 | **Customer Portal** | Customer booking/management app | After 6 |
| 8 | **Analytics** | Operational dashboards, reporting | Later |
| 9 | **Public API** | External/partner API on the domains | Later |
| 10 | **Platform Optimization** | Performance, observability, security, cost | Ongoing |

## Sequencing & gates
- **Epic 2A (Blueprint) is approved** and is the architectural source of truth.
- **Epic 2B (Digital Twin) comes next — no code.** Before any code moves, we document the
  *real* current system (`../99-analysis/platform-digital-twin/`): file/module responsibilities,
  the actual dependency graph with circular-dependency detection (the Dependency Scanner), a
  runtime map, and interaction / ownership / source-of-truth / business-capability matrices.
  This turns documentation into the source of truth for *what exists today*, so migration moves
  **knowledge**, not guesswork.
- **Epic 2B.5 (Architecture Validation) comes after the Digital Twin — no code.** It audits
  consistency across the three sources: **Blueprint** (target) ↔ **Digital Twin** (real) ↔
  **Migration Plan B0–B29**. It runs the 9 validations (backlog, ownership, events, DB, API,
  realtime, monorepo, readiness score, architecture gates) in
  `../99-analysis/architecture-validation/`. It does **not** add descriptive docs — it proves the
  design is executable and surfaces conflicts (e.g. the `lib/queue ↔ lib/n8n` cycle, dual-source
  `config`) before any code moves.
- **Epic 2B (Digital Twin) and 2B.5 (Architecture Validation) are DONE.** The design is
  validated executable (readiness 95.3%; Architecture Gates green). Epic 2C is **approved to
  start**.
- **Epic 2C executes as:** a prep step **2C.0 (Migration Workspace)**, then **4 stages** (see
  `02-architecture/blueprint/MIGRATION_BACKLOG.md` v2 + `MIGRATION_WORKSPACE.md`):
  0. **Migration Workspace (2C.0)** — branch `migration/platform-v2`, flag registry + boot flags,
     branch policy, dual CI, progress dashboard. Safe coexistence with prod.
  1. **Foundation** (B0, B1, B3, **B5A**, B6, B7) — tooling, shared utils, config, auth
     *infrastructure*, validation, types. Invisible; no behavior change. **Mandatory Foundation
     Checkpoint** before Core.
  2. **Core Platform** (B4, B8, B9, B10, B11, B12, **B5B**) — Drizzle DB, repositories,
     domain-service pattern, typed event bus, notifications, shared API layer, auth *persistence*
     (needs B4). This is where logic leaves `app/api`.
  3. **Business Domains** (B13–B21, B27–B31) — Booking, Dispatch, Drivers, Trips, Vehicles,
     Customers, Payments, Analytics, Settings, Ratings, Hotels, Chat, AI, Cases. **Move ownership
     — one domain per PR.**
  4. **Delivery** (B22, B23, B24, B25, B32, B33) — Admin refactor, Socket.IO, feature-flag
     registry, Driver Portal (gate), Customer, Landing.
- **UI is postponed.** `packages/ui` (old B2) and all UI/layout/design-system work start only
  after the platform core (Stages 1–3) is consolidated. Per decision: no presentation work until
  there is a clean platform underneath.
- **Every 2C step is governed by `02-architecture/blueprint/IMPLEMENTATION_RULES.md`** (the
  "manual de obra"): never move without tests, never change behavior, one domain per PR, logic in
  domains not APIs, always compiles/deploys, proven rollback, flag for high-risk, gates block.
- **Epic 2C** produces stable domains, shared infrastructure, and Admin-on-domains — the gate for
  new apps is all three done.

## Mental shift: the platform is the product
After 2C we stop talking about "the Driver Portal" as the goal. The Driver Portal is simply the
**first application that consumes the platform**. The roadmap reframes as:

```
Business Platform (LocalPlug)
        ↓
Core Platform        (packages/db, auth, api, realtime, config, shared, events)
        ↓
Business Domains     (booking, dispatch, drivers, trips, vehicles, customers, payments, …)
        ↓
Shared Services      (notifications, chat, ai, cases, ratings, hotels, analytics, settings)
        ↓
Applications         Admin · Driver · Customer · Landing   (thin consumers)
        ↓
Future APIs · Future Mobile
```

The value from here is **executing the plan with discipline and preserving compatibility at every
step** — not expanding documentation.
- **Refactoring rule (new):** we refactor because **ownership is incorrect**, not because
  code is duplicated. Goal = correct business boundaries, not cleaner code.

## Blueprint location
All Epic 2A deliverables live in `02-architecture/blueprint/`:
`README`, `DOMAIN_MAP`, `PACKAGE_MAP`, `APPLICATION_MAP`, `DATA_OWNERSHIP`, `API_OWNERSHIP`,
`EVENT_OWNERSHIP`, `DATABASE_OWNERSHIP`, `FOLDER_OWNERSHIP`, `DEPENDENCY_GRAPH`,
`INTERACTION_DIAGRAM`, `CONTEXT_DIAGRAM`, `BOUNDED_CONTEXTS`, `SEQUENCE_DIAGRAMS`,
`MIGRATION_BACKLOG`, `FILE_CLASSIFICATION`.

See `FEATURES.md` for the breakdown of each Epic into Features.
