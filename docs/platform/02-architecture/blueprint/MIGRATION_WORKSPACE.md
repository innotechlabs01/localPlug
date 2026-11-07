# MIGRATION_WORKSPACE (Epic 2C.0 — Prep)

> **Pre-step before B0.** Before touching project structure, establish a migration workspace so
> the refactor can coexist with current code **without affecting production**. This is process +
> minimal config only — no business logic moves here.
>
> Governed by `IMPLEMENTATION_RULES.md`. Companion: `MIGRATION_PROGRESS.md` (dashboard),
> `ARCHITECTURE_HEALTH.md` (KPIs), `PLATFORM_EVOLUTION.md` (history).

## 1 · Migration branch
- Long-lived branch **`migration/platform-v2`** is the integration branch for all 2C work.
- All per-step work happens on feature branches `2c/<step>-<slug` (e.g. `2c/b0-tooling`),
  merged into `migration/platform-v2` via PR.
- `main` receives **only stable, deployable** code. The migration branch is deployed to a
  **staging** environment, never to production, until a step is proven.

## 2 · Feature-flag strategy (High-Risk changes)
- A single flag registry (`lib/feature-flags.ts` now → `packages/config` in B24) exposes
  `isEnabled(flag)`. Flags read from env (static) + `settings` table (runtime) once B3/B21 land.
- **Boot flags (all default OFF):** `use-drizzle`, `use-domain-auth`, `use-domain-booking`,
  `use-domain-payments`, `use-domain-notifications`, `use-domain-dispatch`, `use-socketio`.
- Rule: a High-Risk step ships with its flag OFF (old path active). Flip ON only in staging after
  the step's gate + rollback are proven. Rollback = flip OFF.
- No flag may be left ON permanently after a step is proven — either removed or formalized.

## 3 · Branch & merge policy
- `main` = production-stable. Direct pushes forbidden; everything via PR.
- `migration/platform-v2` = integration. PRs require: CI green · step gate ✔ (`ARCHITECTURE_GATES`
  per-step) · `IMPLEMENTATION_RULES` satisfied · review.
- A PR that changes behavior **without** a flag (when High-Risk) is rejected.
- One domain per PR (Rule 3). Cross-domain PRs split.

## 4 · Dual validation pipeline
CI must validate **both** states so neither path silently breaks:
- **Current state** — build + test with all boot flags OFF (the app as it ships today).
- **New state** — build + test with the step's flag ON in the staging deploy (the migrated path).
- A step is "done" only when both states compile, deploy, and the regression suite is green for
  each. This is the mechanical enforcement of "no behavior change" (Rule 2).

## 5 · Progress dashboard
- `MIGRATION_PROGRESS.md` tracks every step B0–B33 (+ this prep) with: status, flag, gate, owner,
  deployed-state, notes. Updated on every PR merge. It is the single live view of 2C health.

## Entry criteria to B0
This prep is complete when: branch exists · flag registry + boot flags present · CI runs dual
state · dashboard initialized · policy documented. Then **B0 (Tooling)** begins.
