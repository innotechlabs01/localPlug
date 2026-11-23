# MVP

Minimum Viable Product definition. Reframed around the platform: the MVP is not "the Driver
Portal" — it is **LocalPlug running as a Business Platform**, proven by the Admin continuing
to work on extracted shared domains, with the **Driver Portal as the first validating
consumer**.

## Platform MVP (Epics 0,1,2A,2B,2B.5 ✅ · 2C 🟡 → 3,4,5 → then 6)

> Executed in 4 stages (Foundation → Core Platform → Business Domains → Delivery) per
> `02-architecture/blueprint/MIGRATION_BACKLOG.md` v2. **UI / design-system work is postponed**
> until the platform core is consolidated.
- **Blueprint approved** — `02-architecture/blueprint/` defines every module's future home.
- **Domains extracted** — Booking, Dispatch, Drivers, Trips, Vehicles, Customers, Payments,
  Notifications logic lives in `packages/domains/*`, not in `app/api/*` or components.
- **Shared infrastructure** — monorepo with `packages/{api,db,auth,realtime}`; Drizzle on
  Turso (ADR-003); Socket.IO realtime (ADR-004) replacing client polling.
- **Admin decoupled** — `admin` consumes domains only; no embedded business logic.
- **Driver Portal (first new app, Epic 6)** — the features below, consuming the same domains.

## Driver Portal MVP scope (first consumer)
- Phone + WhatsApp OTP authentication (Clerk)
- Driver claim + registration
- Availability toggle
- Assignment receive / accept / reject (45s timer)
- Trip lifecycle (heading → pickup → onboard → complete)
- Earnings summary + history
- In-app + WhatsApp notifications
- Offline indicator + PWA installable

## Out of scope (post-MVP)
- Customer Portal, Analytics, Public API (Epics 7–9)
- Advanced dispatch algorithms, real-time analytics dashboards
- Payout automation beyond batch, multi-city / international

## Success metrics
| Metric | Target |
|---|---|
| Platform extraction | 0 business logic in `app/api/*` / components (enforced by lint + `../12-quality/CODE_REVIEW_CHECKLIST.md`) |
| Driver Portal adoption | 80% of active drivers in 3 months |
| Assignment response time | < 30s average |
| Event delivery latency | < 500ms P95 |
| Code coverage | 80%+ |

See `RELEASE_PLAN.md` and sprint tracking in `SPRINTS.md`.
