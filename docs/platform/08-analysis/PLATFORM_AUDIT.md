# Platform Audit

> Status: **Planned** — to be executed in the audit phase before Epic 1 (Platform Foundation)
> and Epic 2 (Driver Portal). This file is the working audit. Populate it when the audit runs.

## Purpose
Verify that the implemented code conforms to the Constitution (`../00-CONSTITUTION.md`) and
the architecture before building new features. The audit is non-destructive: it only
observes and records; it does not change code.

## Audit dimensions
- [ ] Every business domain has a home in `packages/domains/*`
- [ ] Endpoints live in the correct domain package
- [ ] No business logic in React (`apps/*`)
- [ ] No duplicated Admin / Driver logic (shared packages instead)
- [ ] WebSocket events documented in `../02-architecture/event-driven.md`
- [ ] Database schema matches the State Machines (`07-state-machines/`)
- [ ] APIs follow the Constitution (§16) and `../12-quality/API_CHECKLIST.md`
- [ ] Realtime impact handled (`../02-architecture/realtime.md`)
- [ ] Events emitted for cross-domain effects

## Output
- Findings recorded here, grouped by severity
- Critical/High findings feed `TECH_DEBT.md`
- Backlog items flow into `../11-product-management/PRODUCT_BACKLOG.md`

---
_See `../11-product-management/PRODUCT_BACKLOG.md` and
`../11-product-management/SPRINTS.md` for where this audit fits in the roadmap._
