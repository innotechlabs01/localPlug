# Decision Log

Record of product and process decisions that are NOT architecture ADRs (those live in
`05-decisions/`). This log captures *what we chose to build and why*, at the product
level.

## Format
```
## D-<n> — <title> (date)
- Decision: ...
- Rationale: ...
- Impact: ...
```

## Entries
### D-001 — Modular knowledge platform over single spec (2026-07-11)
- Decision: Split the 1596-line `../MASTER_SPEC.md` into layered, hybrid documentation with
  a thin index, Platform Index, and AI context.
- Rationale: Scalability for AI agents and multiple teams over a 5–10 year horizon.
- Impact: Lower context load for agents; clear ownership per domain.

### D-002 — Audit before code (2026-07-11)
- Decision: Run Platform Audit + Technical Debt + Backlog before implementing Driver Portal.
- Rationale: Avoid building features without a common strategy; validate code against the
  Constitution first.
- Impact: Epic 1 (Foundation) precedes Epic 2 (Driver Portal).

### D-003 — Product Management + Quality layers added (2026-07-11)
- Decision: Add `11-product-management/` and `12-quality/` to the platform docs.
- Rationale: LocalPlug is a SaaS; it is maintained via backlog, roadmap, and releases, not
  only technical docs.
- Impact: Every new feature passes the same quality process.

---
_New product decisions append here._
