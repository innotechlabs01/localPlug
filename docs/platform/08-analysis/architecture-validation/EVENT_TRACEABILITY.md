# EVENT_TRACEABILITY (Epic 2B.5)

> **ID note:** B-refs below use pre-2B.5 IDs. Translate via the traceability map in
> `blueprint/MIGRATION_BACKLOG.md` v2 (e.g. ratings B8→B27, settings B11→B21, booking B13→B13,
> dispatch B20→B14, trips B21→B16, vehicles B17→B17, customers B10→B18, payments B16→B19,
> analytics B12→B20, cases B22→B31, realtime B23→B23). Analysis unchanged.

> Every system event must have a complete, traceable chain: **producer → consumer**, with no
> orphan events and no consumer depending on implicit logic. Today's events are *inline side-
> effects* (see `../platform-digital-twin/EVENTS.md`); this doc maps them to the **target** typed
> event flow and flags gaps.

## Legend
- **Producer** = domain that emits. **Consumer(s)** = domains that react.
- ⚠️ = today the link is an inline call / DB row, not a typed event → becomes typed in 2C.
- ❌ = orphan (no consumer) or implicit dependency → must fix.

## Event chains (target)
| Event | Producer | Consumer(s) | Today's transport | Gap |
|---|---|---|---|---|
| `BookingCreated` | Booking | Dispatch, Notifications, Realtime | inline n8n + DB | ⚠️ make typed (B13) |
| `BookingStatusChanged` | Booking | Payments, Notifications, Realtime, Customers | `orders_new` update + poll | ⚠️ typed (B13) |
| `AssignmentCreated` | Dispatch | Driver (future app), Notifications, Realtime | `assignments` insert + n8n | ⚠️ typed (B20) |
| `AssignmentAccepted` | Dispatch (driver) | Booking, Realtime, Notifications | `assignments` update + poll | ⚠️ typed (B20) |
| `AssignmentDeclined` | Dispatch (driver) | Booking, Realtime | `assignments` update + poll | ⚠️ typed (B20) |
| `TripStarted` / `TripCompleted` | Trips (new) | Realtime, Driver, Analytics, Notifications | — (no trips today) | ❌ trips domain must emit (B21) |
| `PaymentConfirmed` | Payments | Booking, Notifications, Realtime | paddle webhook + n8n | ⚠️ typed (B16) |
| `PaymentSplitCreated` | Payments | Booking, Analytics | split cols | ⚠️ typed (B16) |
| `WhatsAppInbound` | Notifications (Evolution webhook) | Chat, Cases | webhook → queue | ⚠️ typed (B17) |
| `ChatMessageSent` | Chat | Agent UI, AI, Notifications | `messages` insert + poll | ⚠️ typed (B18) |
| `ChatEscalated` | Chat | Cases, Notifications | n8n call | ⚠️ typed (B18/B19) |
| `AIReplyGenerated` | AI | Chat, Notifications | ollama call | ⚠️ typed (B19) |
| `RatingSubmitted` | Ratings | Booking, Analytics, Notifications | `ratings` insert | ⚠️ typed (B8) |
| `CaseOpened` / `CaseUpdated` | Cases | Notifications, Realtime | `case_*` rows | ⚠️ typed (B22) |
| `DriverAvailabilityChanged` | Drivers | Dispatch, Realtime | `drivers` update + poll | ⚠️ typed (B14) |
| `ConfigChanged` | Settings | all consumers via Realtime | `settings` update + poll | ⚠️ typed (B11) |

## Orphan / implicit checks
- **Orphans:** `outgoing_messages` rows are written by many producers but consumed only by the
  worker; once typed events exist, the outbox becomes the generic carrier (no orphan).
- **Implicit dependencies:** today `booking` route **calls** the WhatsApp service directly and
  `dispatch` route **calls** n8n directly — these are implicit cross-domain dependencies (the
  source of the `lib/queue ↔ lib/n8n` cycle). In 2C they become `BookingCreated` → Notifications
  subscribes. This **breaks the cycle**.
- **Missing events:** `Trip*` events do not exist (no trips domain) → created in B21; until then
  Driver app cannot receive trip lifecycle → explains why Driver Portal is gated on B21.

## Result
- Every event has a clear producer and ≥1 consumer in the target model.
- All ⚠️ links are scheduled as typed-event introductions in their 2C step (B8, B11, B13, B14,
  B16, B17, B18, B19, B20, B21, B22).
- No orphan remains after outbox generalization. → **Gate 4 accepted as 2C work**.
