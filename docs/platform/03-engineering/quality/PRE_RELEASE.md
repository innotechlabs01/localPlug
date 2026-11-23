# Pre-Release

Run before every production release. Derived from `../02-architecture/deployment.md` and
`../11-product-management/RELEASE_PLAN.md`.

## Build & CI
- [ ] CI green: lint + typecheck + tests
- [ ] Build succeeds for all affected apps
- [ ] No `TODO` in merged code

## Database
- [ ] Migrations additive and backward compatible
- [ ] Migrations run before app deploy
- [ ] Rollback script exists and tested

## Quality gates
- [ ] `CODE_REVIEW_CHECKLIST.md` passed
- [ ] `API_CHECKLIST.md` passed
- [ ] `DATABASE_CHECKLIST.md` passed
- [ ] `SECURITY_CHECKLIST.md` passed
- [ ] `PERFORMANCE_CHECKLIST.md` passed
- [ ] `UX_CHECKLIST.md` passed (UI features)

## Ops
- [ ] Health checks defined and passing
- [ ] Monitoring/alerting verified (`../04-operations/monitoring.md`)
- [ ] Backup verified (`../04-operations/backup.md`)
- [ ] Secrets injected in target env (Coolify)

## Docs & release
- [ ] CHANGELOG entry added (`../11-product-management/CHANGELOG.md`)
- [ ] Relevant `docs/platform/` updated
- [ ] Promotion: Local → Dev → Staging → Production
