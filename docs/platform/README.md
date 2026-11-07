# LocalPlug Platform Documentation

This repository hosts the documentation for the **LocalPlug Business Platform** — a
multi-application operating system for premium airport transfers and tourism
concierge in Medellín, Colombia.

## Start here

Read **`PLATFORM_INDEX.md`** first. It is the single navigation entry point for both
human developers and AI agents, and defines the mandatory reading order before any
code is written.

The immutable, non-negotiable rules live in **`00-CONSTITUTION.md`**.

## Structure

```
docs/platform/
├── 00-CONSTITUTION.md   # immutable platform rules
├── PLATFORM_INDEX.md    # navigation map (read first)
├── README.md            # this file
├── 01-business/         # business domains
├── 02-architecture/     # monorepo, DDD, events, packages, apps, realtime, deploy
├── 03-engineering/      # ai-rules, coding, testing, security, performance, review
├── 04-operations/       # infra, docker, coolify, monitoring, backup, observability
├── 05-decisions/        # ADRs
├── 06-workflows/        # end-to-end business flows
├── 07-state-machines/   # entity lifecycles
├── 08-ui/               # design system, ui inventory, ux flows
├── 09-ai/               # ai context, prompts, architecture & implementation rules
├── 10-reference/        # glossary, naming, conventions
└── archive/             # past spec versions (spec-v1, ...)
```

## Versioning

- Docs evolve under `docs/platform/`.
- When a major restructure happens, the previous tree is **moved** to `archive/spec-vN/`.
- Never delete documentation. Migrate it.

## Related

- Previous (v1) specification: `MASTER_SPEC.md`
- Design spec: `../superpowers/specs/2026-07-11-driver-portal-design.md`
- Implementation plan: `../superpowers/plans/2026-07-11-driver-portal-phase1.md`
