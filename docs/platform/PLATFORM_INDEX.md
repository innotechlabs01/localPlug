# PLATFORM_INDEX (Reading Order)

> **Start here.** This is the canonical directory for the LocalPlug Platform documentation.
> Read top-down. Each layer is more stable than the one below it.

---

## Directory Structure

```
docs/platform/
├── 00-CONSTITUTION.md              ← The immutable law (start here)
│
├── 01-business-model/              ← WHAT the company is (most stable)
│   ├── README.md
│   ├── VISION.md                   ← Problem, solution, where we're going
│   ├── CAPABILITIES.md             ← What the platform can do
│   ├── DOMAIN_MAP.md               ← Who owns what, how domains relate
│   ├── MONETIZATION.md             ← How the platform makes money
│   └── STRATEGIC_ROADMAP.md        ← 1-3 year trajectory
│
├── 01-business/                    ← WHAT each domain does
│   ├── booking/
│   ├── dispatch/
│   ├── drivers/
│   ├── trips/
│   ├── vehicles/
│   ├── payments/
│   ├── notifications/
│   └── analytics/
│
├── 02-architecture/                ← HOW the platform is designed
│   ├── blueprint/                  ← Migration plan, ownership, execution
│   ├── patterns/                   ← Technical patterns (persistence, events)
│   ├── decisions/                  ← ADRs (architectural decision records)
│   ├── workflows/                  ← Business flow diagrams
│   ├── state-machines/             ← Entity state transitions
│   └── *.md                        ← DDD, monorepo, packages, deployment
│
├── 03-engineering/                 ← HOW we build (standards)
│   ├── coding-standards.md
│   ├── testing.md
│   ├── quality-gates.md
│   ├── security.md
│   ├── DEFINITION_OF_DONE.md
│   ├── quality/                    ← Checklists (API, DB, security, UX)
│   └── reference/                  ← Conventions, glossary, naming
│
├── 04-infrastructure/              ← WHERE it runs
│   ├── infrastructure.md
│   ├── docker.md
│   ├── coolify.md
│   ├── monitoring.md
│   ├── observability.md
│   └── backup.md
│
├── 06-applications/                ← WHO consumes the platform
│   ├── ui/                         ← Design system, UX flows
│   ├── admin/                      ← (future)
│   ├── driver/                     ← (future)
│   ├── customer/                   ← (future)
│   └── landing/                    ← (future)
│
├── 07-product/                     ← HOW it evolves
│   ├── EPICS.md
│   ├── FEATURES.md
│   ├── SPRINTS.md
│   ├── RELEASE_PLAN.md
│   └── USER_STORIES.md
│
├── 08-analysis/                    ← HOW we audit and improve
│   ├── MIGRATION_PROGRESS.md       ← Live status of Epic 2C
│   ├── ARCHITECTURE_HEALTH.md      ← Platform health metrics
│   ├── TECH_DEBT.md
│   ├── FOUNDATION_AUDIT.md
│   └── platform-digital-twin/      ← Complete system inventory
│
├── 09-ai/                          ← HOW AI agents collaborate
│   ├── prompts.md
│   ├── context.md
│   ├── architecture-rules.md
│   └── implementation-rules.md
│
└── archive/                        ← Historical versions (never delete)
```

---

## Reading Order (by role)

### New Team Member
1. `00-CONSTITUTION.md` — understand the law
2. `01-business-model/VISION.md` — understand the purpose
3. `01-business-model/CAPABILITIES.md` — understand what it does
4. `01-business-model/DOMAIN_MAP.md` — understand the organization
5. `02-architecture/blueprint/README.md` — understand the migration

### Developer
1. `00-CONSTITUTION.md` — understand the law
2. `03-engineering/coding-standards.md` — understand the rules
3. `03-engineering/DEFINITION_OF_DONE.md` — understand completion criteria
4. `02-architecture/patterns/` — understand technical patterns
5. `08-analysis/MIGRATION_PROGRESS.md` — understand current state

### Product Manager
1. `00-CONSTITUTION.md` — understand the law
2. `01-business-model/STRATEGIC_ROADMAP.md` — understand the trajectory
3. `01-business-model/MONETIZATION.md` — understand the business
4. `07-product/EPICS.md` — understand what's being built
5. `08-analysis/MIGRATION_PROGRESS.md` — understand progress

### AI Agent
1. `00-CONSTITUTION.md` — understand the law
2. `09-ai/architecture-rules.md` — understand architectural constraints
3. `09-ai/implementation-rules.md` — understand implementation rules
4. `02-architecture/blueprint/IMPLEMENTATION_RULES.md` — understand execution rules
5. `08-analysis/MIGRATION_PROGRESS.md` — understand current state

---

## Stability Gradient

From most stable to most changeable:

```
00-CONSTITUTION          ← Changes rarely (years)
01-business-model        ← Changes quarterly
01-business              ← Changes monthly
02-architecture          ← Changes per epic
03-engineering           ← Changes per sprint
04-infrastructure        ← Changes per release
06-applications          ← Changes per feature
07-product               ← Changes per sprint
08-analysis              ← Changes continuously
09-ai                    ← Changes per session
```
