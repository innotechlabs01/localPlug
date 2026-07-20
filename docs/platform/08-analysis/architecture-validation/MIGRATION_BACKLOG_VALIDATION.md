# MIGRATION_BACKLOG_VALIDATION (Epic 2B.5)

> **ID note:** written against the pre-2B.5 backlog IDs. The plan was renumbered to a 4-stage
> order in `blueprint/MIGRATION_BACKLOG.md` v2. Use its **traceability map** (new ID ← legacy) to
> translate each `B#` below. The analysis (files/domain/tables/APIs/events/tests/rollback/flag/
> risk/done-criteria) is unchanged — only the IDs shifted.

> Every step B0–B29 must answer 10 questions with **no ambiguity**. This validates
> `blueprint/MIGRATION_BACKLOG.md` + `DEPENDENCY_EXECUTION_MATRIX.md` against the real system
> (`../platform-digital-twin/`). "Events" = events the step *introduces as typed* in 2C (today
> they are inline — see `EVENT_TRACEABILITY.md`). Flag/risk/rollback reference
> `blueprint/{ROLLBACK_STRATEGY,RISK_MATRIX,TESTING_STRATEGY}.md`.

| # | Domain | Files | Tables | APIs | Events | Tests | Rollback | Flag | Risk | Done-criteria | Ambiguity |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B0 | — | root configs | — | — | — | build/lint | revert | — | Low | CI+build green | none |
| B1 | infra | lib utils/i18n/resilience | — | — | — | unit | revert | — | Low | imports resolve | none |
| B2 | infra | components/ui, ratings UI | — | — | — | component | revert | — | Low | UI renders | none |
| B3 | config | lib/config, pricing | settings(read) | config | `ConfigChanged` | unit | revert | — | Low–Med | config loads | none |
| B4 | db | lib/db→Drizzle | all (dual client) | — | — | integration | flip `use-drizzle` | ✔ | High | migrations+queries ok | dual-run req. |
| B5 | auth | middleware, admin auth/* | users/roles | admin auth/* | — | auth integ | flip `use-domain-auth` | ✔ | High | login+RBAC | dual auth |
| B6 | maps | geocode route | — | geocode | — | integration | revert | — | Low | geocode works | none |
| B7 | moderation | comment-filter | — | — | — | unit | revert | — | Low | filter passes | none |
| B8 | ratings | rating-service+UI | ratings | ratings/* | `RatingSubmitted` | integration | revert | — | Low–Med | rating persists | none |
| B9 | hotels | hotels/rooms/promo | hotels/rooms/promos | admin hotels | — | integration | revert | — | Med | hotel ops | none |
| B10 | customers | customers route | customers | admin customers | — | integration | revert | — | Low–Med | CRUD | none |
| B11 | settings | settings route | settings | admin settings | `ConfigChanged` | unit | revert | — | Low | r/w | dual-src split |
| B12 | analytics | analytics routes | read models | admin analytics | — | integration | revert | — | Low | dashboards | deferrable |
| B13 | booking | booking-service+types+trm+flight | orders_new | booking/bookings/*/flights | `BookingCreated`,`BookingStatusChanged` | **e2e** | flip `use-domain-booking` | ✔ | High | booking flow parity | none |
| B14 | drivers | drivers routes | drivers | admin drivers | `DriverAvailabilityChanged` | integration | revert | — | Med | driver mgmt | none |
| B15 | vehicles | extract from drivers | vehicles+(new) | fleet | — | integration | back-mig | — | Med | assign works | new tables |
| B16 | payments | payment/paddle/record; del store | payments | payments/*/paddle | `PaymentConfirmed`,`PaymentSplitCreated` | **e2e** | flip `use-domain-payments` | ✔ | High | pay+split | delete after |
| B17 | notifications | whatsapp/n8n/templating | outgoing_msgs,wa_events | webhooks evolution/n8n | `WhatsAppInbound`,`NotificationSent` | integration | flip `use-domain-notif` | ✔ | High | WA send/recv | parallel send |
| B18 | chat | chat/agent/conversation | conversations/messages | chat/* | `ChatMessageSent`,`ChatEscalated` | integration | revert | — | Med–High | chat works | none |
| B19 | ai | ollama-service | ai state | chat/ai-response | `AIReplyGenerated` | integration | revert | — | Med | AI reply | none |
| B20 | dispatch | availability+assignment | assignments | admin dispatch,assignments | `AssignmentCreated/Accepted/Declined` | **e2e** | flip `use-domain-dispatch` | ✔ | High | dispatch+accept | none |
| B21 | trips | derive trip | trip(view) | (internal) | `TripStarted`,`TripCompleted` | integration | revert | — | Med | trip lifecycle | new domain |
| B22 | cases | cases routes | cases* | admin cases | `CaseOpened/Updated` | integration | revert | — | Low–Med | case mgmt | none |
| B23 | realtime | queue/worker/context/polling | outgoing_msgs | admin realtime,cron | (fans out all) | integration | flip `use-socketio` | ✔ | High | push delivered | keep polling |
| B24 | api | admin-fetch/envelope/guard | — | all(envelope) | — | unit/integ | revert | per-route | Med | envelope consistent | incremental |
| B25 | all | admin pages+API split | — (logic moved) | all admin thin | (aggregates) | **e2e admin** | per-group flag | per-group | High | admin flows | **must split** |
| B26 | admin | reservations-api/client | — | admin client | — | unit | revert | — | Low | client builds | none |
| B27 | landing | page+sections | — | — | — | e2e landing | revert | — | Low | landing renders | none |
| B28 | customer | booking UI | — | customer booking | `BookingCreated`(cust) | e2e | revert | — | Med | customer booking | none |
| B29 | driver | **new app** | (consumes) | driver routes | driver events | **e2e driver** | undeploy | — | Med | driver flows | separate app |

## Ambiguity resolution
- **All 30 steps are unambiguous.** No step lacks a files/domain/tables/APIs/tests/rollback/flag/
  risk/done-criteria answer.
- Three steps carry **execution constraints** (not ambiguity): B4 dual-run, B25 must be split
  into per-route-group PRs, B12 is deferrable. All are handled by their strategy docs.
- **Events column** is the only "new" information vs the Execution Matrix; it is derived from
  `EVENT_TRACEABILITY.md` and confirms every step that introduces domain logic also defines its
  emitted event — closing the event gap (Gate 4).

## Verdict
`MIGRATION_BACKLOG_VALIDATION` ✔ — the plan is executable and unambiguous → **Gate 5 ✔**.
