# DEPENDENCY_EXECUTION_MATRIX

Per-step execution matrix for the 30 migration steps (B0–B29). Companion to
`MIGRATION_BACKLOG.md` (file-level detail in `FILE_CLASSIFICATION.md`). Every step is
independently deployable, incremental, reversible (see `DEPLOYMENT_STRATEGY.md`,
`ROLLBACK_STRATEGY.md`). **Risk** = Low/Med/High. **Rollback** = Easy/Med/Hard.

> **ID note (v2):** the plan was renumbered to a 4-stage order in `MIGRATION_BACKLOG.md` v2
> (Foundation → Core Platform → Business Domains → Delivery). The IDs in this matrix are the
> **legacy** pre-2B.5 IDs; translate them via the **traceability map** at the bottom of
> `MIGRATION_BACKLOG.md`. The matrix content (files/domains/APIs/DB/risk/rollback/validation/
> tests) remains the authoritative per-step detail. Execution order now follows the 4 stages,
> not the legacy `#` order. See also `IMPLEMENTATION_RULES.md` (governs every step).

| # | ID | Prerequisites | Files affected | Domains | APIs affected | DB impact | Risk | Rollback | Validation | Tests |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | B0 | — | root: new `turbo.json`, per-app configs, CI, boundary lint | — | — | none | Low | Easy (revert config) | CI + build green | build/lint |
| 1 | B1 | B0 | `lib/{logger,date-utils,phone-utils,string-utils,countries,language-utils,message,rate-limit}`, `lib/i18n/*`, `lib/resilience/*` → `packages/shared` | — (infra) | — | none | Low | Easy | imports resolve; app builds | unit (utils) |
| 2 | B2 | B1 | `app/components/ui/*`, `app/components/ratings/*` (Split), `lib/design-tokens` → `packages/ui` | — (infra) | — | none | Low | Easy | UI renders unchanged | component tests |
| 3 | B3 | B1 | `lib/config.ts`, `lib/pricing.ts` (Merge) → `packages/config` | config/settings | `config` | reads `settings` | Low–Med | Easy | config loads; prices correct | unit (config) |
| 4 | B4 | B1 | `lib/db.ts` (Replace→Drizzle), `lib/db/migrate-auto` (Merge), `lib/db/migrations/*`, `scripts/migrate` → `packages/db` | all (db dep) | — | **High** (keep raw client in parallel; dual-run) | High | Med (flag to raw client) | migrations run; queries ok | integration (db) |
| 5 | B5 | B1,B4 | `middleware.ts`, `lib/admin/{auth,permissions,hotel-auth}`, `lib/webhook-auth`, `app/api/webhooks/clerk` → `packages/auth` | auth | admin/permissions,roles,team,employees,modules,users; webhooks/clerk | users/roles/* | High | Med (revert + dual auth) | login + RBAC enforced | auth integration |
| 6 | B6 | B4 | `app/api/geocode`, leaflet map → `domains/maps` | maps | geocode | none | Low | Easy | geocode works | integration |
| 7 | B7 | B1 | `lib/moderation/comment-filter` → `domains/moderation` | moderation | (chat uses) | none | Low | Easy | filter unit tests pass | unit |
| 8 | B8 | B1,B4 | `lib/services/rating-service` + ratings UI (Split) → `domains/ratings` | ratings | ratings/* | ratings table | Low–Med | Easy | ratings persist | integration |
| 9 | B9 | B4 | hotels/rooms/promotions routes+pages → `domains/hotels` | hotels | admin/hotels, hotels, promotions/* | hotels/rooms/promotions | Med | Easy–Med | hotel ops work | integration |
| 10 | B10 | B4,B5 | customers route+page → `domains/customers` | customers | admin/customers | customers | Low–Med | Easy | customer CRUD | integration |
| 11 | B11 | B3,B4 | settings route/config → `domains/settings` | settings | admin/settings, config | settings | Low | Easy | settings read/write | unit |
| 12 | B12 | B4 | analytics/intelligence routes+pages → `domains/analytics` | analytics | admin/analytics | read models | Low | Easy | dashboards render | integration |
| 13 | B13 | B4,B3,B9,B10 | booking-service, reservations-types, trm, flight-validation + booking routes (Split) → `domains/booking` | booking | booking, bookings/*, flights/validate, admin/reservations, admin/orders | orders | High | Med | booking flow unchanged | **e2e booking** |
| 14 | B14 | B4,B5 | drivers routes+pages+documents → `domains/drivers` | drivers | admin/drivers/** | drivers | Med | Easy–Med | driver mgmt works | integration |
| 15 | B15 | B14,B4 | extract vehicle from `drivers` → `domains/vehicles` | vehicles | fleet | **new** vehicles + assignments tables (additive) | Med | Med (additive) | vehicle assign works | integration |
| 16 | B16 | B4,B13 | payment-service, paddle, payment-record; **Delete** `payment-store.ts` (after) → `domains/payments` | payments | payments/**, webhooks/paddle, admin/payments | payments | High | Med (keep dup until migrated) | payment + split correct | **e2e payment** |
| 17 | B17 | B1,B4,B5 | whatsapp-service (Split), n8n/client (Split), templating → `domains/notifications` | notifications | webhooks/evolution, n8n, chat notify, cron/process-queue | outgoing_messages, whatsapp_events | High | Med | WhatsApp send/recv | integration |
| 18 | B18 | B4,B17,B7 | chat-service, agent-service, conversation (Split) → `domains/chat` | chat | chat/** | conversations/messages | Med–High | Med | chat works | integration |
| 19 | B19 | B18,B17 | ollama-service → `domains/ai` | ai | chat/ai-response | ai state | Med | Easy–Med | AI reply/escalate | integration |
| 20 | B20 | B13,B14,B15 | availability (Move) + assignment routes (Split) → `domains/dispatch` | dispatch | admin/dispatch, assignments/** | assignments | High | Med | dispatch + accept flow | **e2e dispatch** |
| 21 | B21 | B20,B13,B16 | derive trip from orders+assignments → `domains/trips` | trips | (internal trip state) | trip view/state | Med | Easy–Med | trip lifecycle | integration |
| 22 | B22 | B14,B5 | cases routes+pages → `domains/cases` | cases | admin/cases/** | cases* | Low–Med | Easy | case mgmt works | integration |
| 23 | B23 | B17,B1 | queue/worker, whatsapp-event, realtime-context (Replace), use-polling (Replace), admin/realtime (Replace), cron → `packages/realtime` | realtime (infra) | admin/realtime, cron/process-queue | outgoing_messages (worker) | High | Med (keep polling via flag) | push delivered; no regression | integration (socket) |
| 24 | B24 | B5 | admin-fetch, response/error envelope, route guard, webhook-auth → `packages/api` | api (infra) | all routes adopt envelope | none | Med | Easy–Med | envelope consistent | unit/integration |
| 25 | B25 | B13–B24 | admin pages (Move) + API routes (Split to thin) → `apps/admin` | all (consumed) | all admin routes thin | none (logic moved) | High | **Hard** → split per route-group + flag | admin flows unchanged | **e2e admin** |
| 26 | B26 | B25 | reservations-api/client → `apps/admin/lib` | — | admin client | none | Low | Easy | admin client builds | unit |
| 27 | B27 | B2 | page.tsx + sections + hooks (Move) → `apps/landing` | — (content) | none | none | Low | Easy | landing renders | e2e landing |
| 28 | B28 | B13,B2,B16 | booking UI (Move+Split) → `apps/customer` | booking (consumed) | customer booking | none | Med | Easy–Med | customer booking works | e2e |
| 29 | B29 | B14,B20,B21,B16,B17,B23,B5 | **NEW** app → `apps/driver` | drivers/dispatch/trips/payments/notifications | driver routes | none (consumes) | Med | Easy (separate app) | driver flows work | **e2e driver** |

## Notes
- **High-risk steps** (B4, B5, B13, B16, B17, B20, B23, B25) must ship behind a feature flag
  and include a rehearsed rollback. B25 is split into per-route-group PRs to stay deployable.
- **DB-impact steps** (B4, B15) are additive-first; destructive/delete actions (B16 dup delete)
  happen only after the migration lands and tests pass.
- Every step's "Validation" + "Tests" map to `TESTING_STRATEGY.md` and `SUCCESS_CRITERIA.md`.
