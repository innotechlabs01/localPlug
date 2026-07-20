# PLATFORM_EVOLUTION

> **Architectural history of LocalPlug — not a changelog.**
> A changelog records *what* changed. This records *why the platform evolved* and *what it meant*.
> Read this to understand the reasoning behind structural decisions; read `MIGRATION_PROGRESS.md`
> for task status and `ARCHITECTURE_HEALTH.md` for live quality.
>
> Entries are appended as the platform crosses architectural milestones. Each entry: version ·
> decision · reason · impact.

---

## v1.0 — Monolith (baseline)
- **Decision:** single Next.js app (`app/`, `lib/`, `components/`) serving Admin + public site,
  with business logic living inside API routes and React components.
- **Reason:** fastest path to a working product.
- **Impact:** domains are implicit; ownership is blurred; `app/api` and components contain
  business rules; several circular dependencies (`lib/queue ↔ lib/n8n`, `lib/config ↔ lib/db`).

## v2.0 — Business Platform
- **Decision:** adopt the **Business Platform** model — reusable domains (Booking, Dispatch,
  Drivers, Trips, Vehicles, Customers, Payments, …) consumed by thin applications (Admin, Driver,
  Customer, Landing).
- **Reason:** the Driver Portal was treated as *the project*; in reality it is only the first
  consumer. To build more apps safely we need stable, owned domains first.
- **Impact:** the Driver Portal stops being the objective and becomes the **first application**
  that consumes the platform. Roadmap reframed: Platform → Core → Domains → Shared Services →
  Applications → Future APIs/Mobile. Refactor guided by **ownership, not duplication**
  (Constitution §14).

## v2.1 — Drizzle + Event Bus (Core Platform)
- **Decision:** replace the ad-hoc DB client with **Drizzle** (ADR-003) and introduce a **typed
  event bus + outbox**, replacing inline n8n/DB side-effects.
- **Reason:** the `lib/queue ↔ lib/n8n` cycle and implicit cross-domain calls made changes
  unsafe; a single DB client and explicit events make ownership enforceable.
- **Impact:** business logic begins moving out of `app/api` into `packages/domains/*`; cross-domain
  changes become typed events; the circular dependency is broken.

## v2.2 — Trips becomes a domain
- **Decision:** **Dispatch stops creating Trips inline**; Trips becomes an independent domain
  derived from orders + assignments.
- **Reason:** trips were embedded in booking/dispatch, with no owner; extracting them gives a
  first-class lifecycle (heading → pickup → onboard → complete) and unblocks the Driver app.
- **Impact:** Driver Portal (Epic 6) can consume a real trip lifecycle; dispatch owns only
  assignment, not trip state.

## v2.3 — Socket.IO replaces polling
- **Decision:** introduce **Socket.IO** as the realtime fan-out over the event bus; client polling
  retained as fallback during cutover (ADR-004).
- **Reason:** the admin/chat/driver UIs polled every 2s; an event-driven push is lower-latency and
  scales better.
- **Impact:** realtime becomes a shared service; polling is deprecated but kept as a reversible
  rollback path.

## v2.4 — Admin becomes a pure consumer
- **Decision:** `apps/admin` API routes become thin orchestrators; all business logic lives in
  domains.
- **Reason:** admin was the largest holder of embedded business logic.
- **Impact:** the platform is consumable by any app; the Driver Portal gate opens.

---
*Add a new entry when an architectural milestone lands (a domain extracted, a pattern adopted, a
dependency broken). Keep it short: decision · reason · impact.*
