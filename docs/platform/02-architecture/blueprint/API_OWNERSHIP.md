# API_OWNERSHIP

The API surface is split by **owning domain** and **exposing app**. Routes become thin
orchestrators that call a domain service; the logic moves to `packages/domains/*`
(`FILE_CLASSIFICATION.md` marks these as `Split`).

## By domain (current route group → owner → app that exposes it)

| Current route group | Owning domain | Exposes in app | Action |
|---|---|---|---|
| `app/api/booking`, `bookings/*`, `flights/validate`, `admin/reservations/*`, `admin/orders/*` | booking | admin (+ customer later) | Split |
| `app/api/admin/dispatch`, `app/api/assignments/*` | dispatch | admin | Split |
| `app/api/admin/drivers/**` | drivers | admin | Split |
| `app/api/admin/fleet`, vehicle fields | vehicles | admin | Split |
| `app/api/admin/customers` | customers | admin | Split |
| `app/api/payments/**`, `webhooks/paddle`, `admin/payments/**` | payments | admin (+ customer) | Split |
| `app/api/webhooks/evolution`, `webhooks/n8n`, `chat/*` (notify), `cron/process-queue` | notifications | admin | Split / Move (realtime) |
| `app/api/chat/**` | chat | admin | Split |
| `app/api/chat/ai-response`, ollama wiring | ai | admin / landing | Split |
| `app/api/admin/analytics`, `intelligence` | analytics | admin | Split |
| `app/api/admin/settings`, `config` | settings / config | admin | Split |
| `app/api/admin/cases/**` | cases | admin | Split |
| `app/api/admin/hotels/**`, `rooms`, `promotions`, `hotels` (public), `promotions/validate` | hotels | admin (+ public API later) | Split |
| `app/api/ratings/**` | ratings | landing / admin | Split |
| `app/api/geocode` | maps | admin / landing | Split |
| `app/api/admin/permissions`, `roles`, `team`, `employees`, `modules`, `users`, `webhooks/clerk` | auth | admin | Split / Move (auth pkg) |
| `app/api/admin/realtime`, `admin/queue` | realtime | admin | Replace |
| `app/api/health` | (platform) | admin | Keep |

## Rules
- A route handler **orchestrates** (auth check → validate → call domain → return envelope).
  It does **not** contain SQL or business rules.
- Domain-to-domain calls are forbidden in routes; use events.
- Public/external routes (future Epic 9) are a separate surface on top of domains, not on admin.

See `PACKAGE_MAP.md` (`packages/api`) for the response/error contract used by all routes.
