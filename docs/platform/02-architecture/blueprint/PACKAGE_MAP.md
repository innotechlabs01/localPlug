# PACKAGE_MAP

Cross-cutting packages shared by all domains and applications. These are **not** business
domains — they provide infrastructure and contracts.

| Package | Responsibility | Moves in from (current) | Exposes |
|---|---|---|---|
| **`packages/api`** | HTTP contract utilities: response envelope `{success,data,meta}`, error shape, Zod-route helper, auth guards, shared admin fetch | `lib/admin/admin-fetch.ts`, response/error helpers, `lib/webhook-auth.ts` (verify) | `ok()`, `fail()`, `defineRoute()`, `requireRole()` |
| **`packages/db`** | Drizzle client (ADR-003), migrations, migrate runner, connection pool | `lib/db.ts` (Replace), `lib/db/migrate-auto.ts` (Merge), `lib/db/migrations/*`, `scripts/migrate.ts` | `db`, `schema`, `migrate()` |
| **`packages/auth`** | Clerk identity, RBAC (`requireRole`/`requirePermission`), hotel context, webhook verify, shared middleware | `middleware.ts`, `lib/admin/auth.ts`, `lib/admin/permissions.ts`, `lib/admin/hotel-auth.ts`, `app/api/webhooks/clerk/route.ts`, `lib/webhook-auth.ts` | `getSession()`, `requireRole()`, `resolveHotelContext()` |
| **`packages/realtime`** | Socket.IO server + client + typed event bus + outbox worker (ADR-004) | `lib/queue/*`, `lib/whatsapp-event.ts` (event catalog), `lib/admin/realtime-context.tsx` (Replace), `app/admin/dispatch/use-polling.ts` (Replace), `app/api/admin/realtime/route.ts` (Replace), `app/api/cron/process-queue/route.ts` | `emit()`, `on()`, `EventBus` |
| **`packages/config`** | Settings table access + env validation + pricing/FX defaults | `lib/config.ts`, `lib/pricing.ts` (Merge), `lib/trm.ts` (FX→booking, not here) | `getSetting()`, `getConfigPackagePrice()` |
| **`packages/shared`** | Framework-agnostic utils + i18n + resilience | `lib/{logger,date-utils,phone-utils,string-utils,countries,language-utils,message,rate-limit}.ts`, `lib/i18n/*`, `lib/resilience/circuit-breaker.ts` | utils, `detectLanguage()`, `withCircuitBreaker()` |
| **`packages/ui`** | Design-system components + tokens (shared by all apps) | `app/components/ui/*`, `app/components/ratings/*` (Split), `lib/design-tokens.ts` | `<Button>`, `<Input>`, theme |
| **`packages/validation`** | Shared Zod schemas (optional, can live per-domain) | new (extracted from route handlers) | schemas |

## Dependency rules
- `packages/*` **never** import `apps/*`.
- `packages/domains/*` import only: `db`, `shared`, `config`, `validation`, `realtime` (emit),
  and **other domains only via events**, never via direct call (except read-only analytics).
- `packages/api` may depend on `auth` + any domain (to orchestrate a route).
- `packages/realtime` is pure broadcast + outbox; it contains **no business logic** of its own.

See `DEPENDENCY_GRAPH.md` for the full directed graph.
