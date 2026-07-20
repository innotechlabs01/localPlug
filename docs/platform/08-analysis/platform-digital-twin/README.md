# Platform Digital Twin (Epic 2B)

> **No code changes.** This folder is a faithful, machine-assisted mirror of the **current**
> LocalPlug monolith — the system *as it really exists today*, not the ideal target defined by
> the Blueprint (`../02-architecture/blueprint/`).
>
> **Purpose:** before migrating one line of code (Epic 2C), we must know *exactly* what exists.
> This twin is the **source of truth for the real system**. It lets any human or AI understand
> the platform without re-reading all 219 source files, and it makes the migration move
> **knowledge**, not guesswork.
>
> All data here is derived from the actual code (the `DEPENDENCIES/` scanner runs against
> `app/`, `lib/`, `components/`, `scripts/`) or from reading the real files — not from the
> ideal architecture.

## Why this epic exists (and why before 2C)
The Blueprint answers *"how should LocalPlug end up?"*. The Discovery answers *"what is broadly
wrong?"*. Neither answers *"what exists, file by file, responsibility by responsibility, today?"*.
That gap is what makes refactoring risky. The Digital Twin closes it:

- **FILES/** — every real source file, its real responsibilities, and its proposed destination.
- **MODULES/** — logical modules (Booking, Dispatch, Drivers, …), their real responsibilities,
  and the proposed split into services/repositories/validators/publishers.
- **DEPENDENCIES/** — the real import graph + **circular-dependency detection** (the Dependency
  Scanner), so cycles are found *before* migration.
- **DATABASE/** — real tables, owners, and access paths.
- **APIS/** — real route surfaces (admin, public, webhooks) and what they really do.
- **WEBSOCKETS/** — real realtime channels/events today (polling vs Socket.IO).
- **EVENTS/** — real events emitted/consumed today.
- **UI/** — real pages/components and which domain logic they embed.

## Analytical maps (the high-value synthesis)
- **RUNTIME_MAP.md** — client → page → API → domain → downstream → realtime flow.
- **INTERACTION_MATRIX.md** — module × module interaction (detects future coupling).
- **OWNERSHIP_MATRIX.md** — feature → owning module (today).
- **SOURCE_OF_TRUTH_MATRIX.md** — concept → single source today (prevents duplication forever).
- **BUSINESS_CAPABILITY_MAP.md** — enterprise architecture: capability → sub-capability.

## How it was produced
1. `DEPENDENCIES/scan-deps.mjs` parses every `import`/`require`/dynamic `import` in the source
   tree, resolves them, builds the file/dependency graph, and reports circular dependencies.
2. `FILES/` and `MODULES/` are derived by reading the real files the scanner maps.
3. Matrices are synthesized from the dependency graph + the Blueprint's ownership intent.

## Relationship to other docs
| Doc | Question it answers |
|---|---|
| `99-analysis/PLATFORM_DISCOVERY.md` | What is broadly wrong (as-is map, tech debt) |
| `02-architecture/blueprint/` | How should it end up (target) |
| **`99-analysis/platform-digital-twin/`** | **What exists exactly today (real mirror)** |

## Status
- Epic 2B: **In progress** — structure, scanner, file/module inventory, dependency graph, and
  the analytical maps are populated. Remaining: deepen any module doc as code is read; keep the
  scanner re-run on every structural change.
- Epic 2C (Refactoring) is **blocked** until this twin is complete and the Migration Execution
  Plan is revalidated against it.

## Deliverables index (this folder)
| Doc | What it answers (real) |
|---|---|
| `FILES/INVENTORY.md` | Every real source file (220), grouped by domain → `MODULES/<x>.md` |
| `MODULES/*.md` (17) | Per-domain real files, responsibilities, problems, proposed split |
| `DEPENDENCIES/scan-deps.mjs` | Dependency Scanner (real imports → graph + circular-dep detection) |
| `DEPENDENCIES/DEPENDENCY_GRAPH.md` | Real module graph + **cycles found** (`lib/queue ↔ lib/n8n`, `lib/config ↔ lib/db`) |
| `DATABASE/DATABASE.md` | Real tables (25), raw `@libsql/client` layer, db↔config cycle, browser-bundle leak |
| `APIS/APIS.md` | Real route surfaces (admin / public / webhooks / cron) + per-route domain |
| `WEBSOCKETS/WEBSOCKETS.md` | Reality: polling, not sockets; what becomes Socket.IO |
| `EVENTS/EVENTS.md` | Reality: inline side-effects + `outgoing_messages` outbox; what becomes typed events |
| `RUNTIME_MAP.md` | Real request-time flows (booking / dispatch / chat+AI / payment / notify) |
| `INTERACTION_MATRIX.md` | Domain × domain: **D** (code dep) vs **B** (runtime) vs — ; coupling early-warning |
| `OWNERSHIP_MATRIX.md` | Feature → real owning file today |
| `SOURCE_OF_TRUTH_MATRIX.md` | Concept → single source today; flags dual/missing sources |
| `BUSINESS_CAPABILITY_MAP.md` | Enterprise capability tree → real implementing modules |

## How to keep it real
- Re-run `node DEPENDENCIES/scan-deps.mjs` after any structural change; the cycle list is the
  gate for 2C.
- Every `MODULES/*.md` is written from reading the actual code — do not edit it from memory;
  re-read the file it documents.
