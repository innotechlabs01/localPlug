# Sprints

Sprint planning for the platform. Populated after the Product Backlog is approved.

## Principle
- No code before the Platform Audit (`../99-analysis/PLATFORM_AUDIT.md`) and backlog approval.
- Each Sprint pulls from the highest-priority Epic (Foundation → Driver Portal).
- Every Sprint ends with CI green and quality checklists passed (`12-quality/`).

## Proposed cadence
| Sprint | Epic | Goal |
|---|---|---|
| S0 | Foundation | Audit + tech debt + backlog (no feature code) |
| S1 | Foundation | Extract shared packages, CI gates |
| S2 | Driver Portal | Auth + Registration + Claim |
| S3 | Driver Portal | Availability + Assignments |
| S4 | Driver Portal | Trip + Schedule + Earnings |
| S5 | Driver Portal | Dashboard + Notifications + Settings |
| S6 | Realtime | Redis adapter, scaling |

## Definition of Done
- Domain logic in `packages/domains/*`.
- Events emitted for cross-domain effects.
- Tests cover critical paths (Vitest/Playwright).
- Quality checklists (`12-quality/`) passed in review.
- Docs updated if behavior changed.
