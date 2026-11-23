# DATABASE (Real — Digital Twin)

> Source of truth for what the data layer **is today**. No code changes. Tables enumerated from
> `lib/db/migrations/*.sql`; access layer read from `lib/db.ts` + `lib/db/migrate-auto.ts`.

## Access layer (real)
- **File:** `lib/db.ts` — raw `@libsql/client` singleton (`getDb()`). Provides `executeWithRetry`
  (busy/locked retry), `buildSafeUpdate` (column whitelist → SQL-injection safe), and
  `incrementPromotionUsage`. **ADR-003 (Drizzle) is NOT implemented** — this is the raw client.
- **File:** `lib/db/migrate-auto.ts` — auto-migration runner (applied on boot).
- **Coupling issue (real):** `lib/db.ts` dynamically imports `@/lib/config` (for `validateEnv()`
  inside `getDb()`), and `lib/config.ts` imports the DB — a **confirmed circular dependency**
  (`lib/config.ts ↔ lib/db.ts`, detected by `DEPENDENCIES/scan-deps.mjs`). Resolution target:
  move `validateEnv`/env access to `packages/config` so neither `db` nor `config` imports the
  other.
- **Critical issue (real):** `lib/db.ts` has **in-degree 78** in the scanner — it is imported
  directly by ~78 files, including client/browser components. The DB client leaks into the
  browser bundle (violates the Blueprint's `packages/db` ownership rule).

## Real tables (25, from migrations)
`assignments` · `case_documents` · `case_events` · `case_tasks` · `cases` · `chat_sessions` ·
`conversation_ratings` · `conversations` · `customers` · `drivers` · `employee_activity` ·
`employee_documents` · `hotels` · `messages` · `modules` · `orders_new` · `outgoing_messages` ·
`promotions` · `ratings` · `role_permissions` · `room_bookings` · `rooms` · `settings` ·
`support_agents` · `whatsapp_events`

(An `orders` table is referenced by FK migrations though the canonical create is `orders_new`;
confirm during MODULES/BOOKING deep-read.)

## Real table → domain ownership (today, embedded)
| Table(s) | Touched by (real modules) | Should own (Blueprint) |
|---|---|---|
| `orders_new`, `room_bookings` | booking routes, admin orders | `domains/booking` |
| `assignments` | dispatch routes, assignments routes, n8n | `domains/dispatch` |
| `drivers`, `employee_*` | drivers routes, auth | `domains/drivers` / `domains/auth` |
| `customers` | customers routes | `domains/customers` |
| `promotions`, `hotels`, `rooms` | hotels/rooms/promotions routes | `domains/hotels` |
| `payments`/`orders_new` split cols, `outgoing_messages` | payments routes, paddle webhook | `domains/payments` |
| `outgoing_messages`, `whatsapp_events` | queue worker, evolution webhook | `domains/notifications` |
| `conversations`, `messages`, `chat_sessions`, `support_agents`, `conversation_ratings` | chat routes, ollama | `domains/chat` / `domains/ai` |
| `cases`, `case_*` | cases routes | `domains/cases` |
| `ratings` | ratings routes | `domains/ratings` |
| `modules`, `role_permissions` | auth/permissions routes | `domains/auth` |
| `settings` | settings/config routes | `domains/settings` |
| `customers` (return cols) | booking | `domains/booking` + `domains/customers` |

## Observations
- No ORM/migration tooling as code — migrations are raw `.sql` applied by `migrate-auto`.
- Ownership is **by access pattern, not by domain**: many domains read/write `orders_new`
  directly (booking, dispatch, payments, admin), which is the core reason the Blueprint splits
  them into owned domains with repositories.
- `outgoing_messages` is the realtime/notification outbox (polled by `whatsapp-worker`); it is
  the natural seed for `packages/realtime` + an event outbox.
