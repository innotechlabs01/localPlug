# Release Plan

How LocalPlug ships. Releases are planned, not ad-hoc.

## Promotion path
```
Local → Development → Staging → Production
```
See `../02-architecture/deployment.md`.

## Release principles
- No direct production deploys; all via CI/CD.
- DB migrations run before app deploy (backward compatible).
- Rollback capability required (`../02-architecture/deployment.md` §Zero-Downtime).
- Every release has a CHANGELOG entry (`CHANGELOG.md`).
- Every release passes `../12-quality/PRE_RELEASE.md`.

## Roadmap (high level)
| Phase | Scope |
|---|---|
| Phase 1 | Admin (active) + Driver Portal (MVP) + shared packages |
| Phase 2 | Customer Portal + realtime analytics + dispatch algorithms |
| Phase 3 | Mobile (RN) + multi-city + AI matching |
| Phase 4 | API marketplace + white-label + international |

See `EPICS.md`, `MVP.md`, `SPRINTS.md`.
