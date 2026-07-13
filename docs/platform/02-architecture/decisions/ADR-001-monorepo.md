# ADR-001 — Turborepo Monorepo

**Status:** Accepted
**Date:** 2026-07-11

## Context
LocalPlug spans multiple applications (Admin, Driver, Customer, Landing) that share
business logic. A single Next.js app or separate repos would duplicate logic and
slow delivery of new portals.

## Decision
Adopt a **Turborepo + pnpm workspaces** monorepo with `apps/*` and `packages/*`
(including `packages/domains/*`). Shared business logic lives in domain packages;
apps stay thin and interchangeable.

## Consequences
- ✅ New portals reuse domains without duplication.
- ✅ Atomic changes across apps and packages.
- ⚠️ Requires discipline on dependency direction (enforced by Constitution).
- ⚠️ Build tooling complexity (mitigated by Turborepo pipelines).
