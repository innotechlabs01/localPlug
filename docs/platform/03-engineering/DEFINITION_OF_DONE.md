# DEFINITION_OF_DONE (LocalPlug)

> The LocalPlug Definition of Done — **not** the Scrum DoD. This is the acceptance bar every
> task/PR in Epic 2C (and after) must clear. It is the per-task expression of
> `IMPLEMENTATION_RULES.md` + `ARCHITECTURE_HEALTH.md`. A task is **not done** until all are true.

A task is done only when:

| # | Criterion | How it is verified |
|---|---|---|
| 1 | **Compiles** | `tsc --noEmit` + `next build` pass |
| 2 | **Lint OK** | `pnpm lint` clean (boundary guards active) |
| 3 | **Tests OK** | unit + integration green for the moved behavior |
| 4 | **No new technical debt** | no new `TECH_DEBT` entry; existing debt this step touches is noted |
| 5 | **Correct ownership** | the changed concept has exactly one writer (no new multi-writer) |
| 6 | **Correct domain** | logic lives in the right domain, not in a route/component |
| 7 | **No duplication** | behavior moved, not copied (Constitution §14) |
| 8 | **Documentation updated** | `MIGRATION_PROGRESS.md` + relevant domain/architecture doc updated |
| 9 | **Feature flag if applicable** | High-Risk change ships behind a `use-*` flag (default OFF) |
| 10 | **Rollback proven** | flip flag / revert migration tested in staging |
| 11 | **CI green** | `ci-migration.yml` passes on the PR |
| 12 | **Architecture Health does not decrease** | `ARCHITECTURE_HEALTH.md` KPI not worsened by this step |

## Notes
- Criteria 5–7 are the ownership discipline: we refactor because ownership is wrong, not because
  code is duplicated. **Move behavior; never change it.**
- Criterion 12 means a step may not trade one KPI for another (e.g. fixing a cycle must not
  introduce a new multi-writer). The health dashboard is the judge.
- This DoD is checked at every PR review and at every stage checkpoint
  (`IMPLEMENTATION_RULES.md` → Foundation Checkpoint).
