# ADR-003 — Turso (libSQL) + Drizzle

**Status:** Accepted
**Date:** 2026-07-11

## Context
We need an edge-friendly, type-safe database with low operational overhead and the
ability to scale to multiple cities. Postgres would be heavier to operate today.

## Decision
Use **Turso (libSQL, SQLite-compatible)** with **Drizzle ORM**. UUID v4 PKs, soft
deletes, optimistic concurrency (`version` + `updated_at`), and audit timestamps on
all core tables. Migrations are additive, versioned SQL files.

## Consequences
- ✅ Edge replication, type safety, small ops footprint.
- ✅ Additive migrations keep production safe.
- ⚠️ SQLite lacks some complex-query features; future Postgres add-on planned
  (see `archive/spec-v1` Future Vision) for analytical workloads.
