# LocalPlug Master Specification

## Purpose

This document is the **entry point** for the entire LocalPlug platform documentation.

LocalPlug is a **Business Operating Platform** — not a collection of pages, not an
admin dashboard. It is a scalable platform composed of multiple web applications
(Admin, Driver, Customer, Landing) that share the same business platform and domains.

> The immutable rules live in `00-CONSTITUTION.md`.
> The navigation map for humans and AIs is `PLATFORM_INDEX.md`.
> This file only points to specialized documents — it contains no rules of its own.

---

## Product Vision
See: `01-business/` (domains) and `00-CONSTITUTION.md` §1 Identity

## Architecture
See: `02-architecture/ARCHITECTURE` overview → `02-architecture/monorepo.md`, `02-architecture/ddd.md`, `02-architecture/event-driven.md`
See: `02-architecture/blueprint/` — Epic 2A master plan (maps, ownership, diagrams, file classification, migration backlog)

## Business Domains
See: `01-business/` — booking, dispatch, drivers, trips, vehicles, payments, notifications, analytics

## Workflows
See: `06-workflows/` — booking, dispatch, assignment, trip, payment, notification

## State Machines
See: `07-state-machines/` — booking, assignment, trip, payment, driver

## Applications
See: `02-architecture/applications.md`

## Database
See: `00-CONSTITUTION.md` §8 and `06-workflows/`

## API & Realtime
See: `02-architecture/packages.md`, `02-architecture/realtime.md`, `02-architecture/event-driven.md`

## Infrastructure
See: `04-operations/` — infrastructure, docker, coolify, monitoring, backup, observability

## Engineering Standards
See: `03-engineering/` — coding, testing, security, performance, review, quality-gates, ai-rules

## AI Context (the "brain")
See: `03-engineering/ai-rules.md` (canonical) and `09-ai/` — master-context, prompts, architecture-rules, implementation-rules

## Architecture Decisions
See: `05-decisions/` — ADR-001…ADR-005

## UI / Design System
See: `08-ui/` — design-system, ui-inventory, ux-flows

## Reference
See: `10-reference/` — glossary, naming, conventions

## Product Management
See: `11-product-management/` — PRODUCT_BACKLOG, EPICS, FEATURES, USER_STORIES, SPRINTS, MVP, RELEASE_PLAN, CHANGELOG, DECISION_LOG

## Quality
See: `12-quality/` — CODE_REVIEW_CHECKLIST, UX_CHECKLIST, API_CHECKLIST, DATABASE_CHECKLIST, SECURITY_CHECKLIST, PERFORMANCE_CHECKLIST, PRE_RELEASE

## Evolution & Analysis
See: `99-analysis/` — PLATFORM_DISCOVERY (as-is code map), CURRENT_ARCHITECTURE (as-is snapshot), PLATFORM_AUDIT, TECH_DEBT, MIGRATION_PLAN, REFACTOR_REPORT

---

## How to start
1. Read `PLATFORM_INDEX.md`
2. Read `00-CONSTITUTION.md`
3. Follow the reading order defined in `PLATFORM_INDEX.md`
