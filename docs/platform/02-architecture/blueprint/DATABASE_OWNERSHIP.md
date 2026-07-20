# DATABASE_OWNERSHIP

Tables are owned by exactly one domain. Migrations live in the owning domain's schema folder
under `packages/db/migrations` (consolidated) or per-domain schema modules. The DB client is
shared (`packages/db`), but **schema ownership is per domain**.

## Tables → owning domain

| Table(s) | Owner domain |
|---|---|
| `orders`, `order_status_history`, `order_comments` | booking |
| `assignments` | dispatch |
| `drivers`, `driver_compliance`, `employee_documents` | drivers |
| `vehicles`, `driver_vehicle_assignments` | vehicles |
| `customers` | customers |
| `payments` | payments |
| `outgoing_messages`, `whatsapp_events` | notifications |
| `conversations`, `messages`, `support_agents`, `chat_sessions` | chat |
| (AI session state) | ai |
| `settings` | settings |
| `cases`, `case_events`, `case_documents`, `case_tasks` | cases |
| `hotels`, `rooms`, `promotions`, `room_bookings` | hotels |
| `ratings`, `conversation_ratings` | ratings |
| `users`, `roles`, `user_roles`, `modules`, `role_permissions`, `employee_activity` | auth |
| `sqlite_sequence` | (system) |

## Migration ownership
- **Today:** 30 `.sql` files in `lib/db/migrations/`, applied by `scripts/migrate.ts`; plus a
  second path `lib/db/migrate-auto.ts#ensureSchema()` that bootstraps RBAC. (TECH_DEBT M-3)
- **Target:** all migrations consolidated under `packages/db/migrations/`; RBAC bootstrap
  becomes a normal migration (no second path). Drizzle manages schema (ADR-003).
- Each new domain table is added by that domain's migration; no cross-domain migrations.
- Soft deletes (`deleted_at`/`deleted_by`), UUID PKs, `version`/`updated_at` per Constitution §8.

## Rule
A domain reads/writes **only its own tables** via `packages/db`. Cross-domain data needs are
satisfied by events or read models, never by querying another domain's tables.
