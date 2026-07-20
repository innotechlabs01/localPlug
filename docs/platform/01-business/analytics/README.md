# Business Domain — Analytics

**Purpose:** Metrics, reporting, and performance tracking across the platform.

## Entities
- `Metric` — a tracked KPI
- `Report` — aggregated reporting view
- `Dashboard` — composed operational view (dispatch, admin)

## Events
- `stats:update` — emitted on relevant state changes for live dashboards

## Business Rules
- Analytics are derived (read models), never a source of truth.
- Real-time dashboards subscribe to `stats:update` via the `admin`/`dispatch` rooms.
- Reporting queries must not run on hot transactional tables in production.

## Related
- Domain package: `packages/domains/analytics`
- See also: `../../02-architecture/realtime.md`
