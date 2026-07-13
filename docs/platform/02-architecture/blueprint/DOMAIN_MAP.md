# DOMAIN_MAP

The Business Platform is composed of **business domains**. Each domain owns its logic,
data, and events. Applications never contain domain logic — they call domains.

## Domains (future: `packages/domains/<name>`)

| Domain | Responsibility | Owns (entities/tables) | Publishes events | Depends on |
|---|---|---|---|---|
| **booking** | Create/reserve an order, pricing, flight validation, FX | `orders`, `reservations` types | `booking.created`, `booking.confirmed`, `booking.cancelled` | payments, customers, dispatch, config |
| **dispatch** | Match assignments to drivers, availability, ETA | `assignments`, availability rules | `assignment.created`, `assignment.accepted`, `assignment.declined`, `driver.busy`/`available` | drivers, trips, booking, notifications |
| **drivers** | Driver accounts, documents, compliance, performance | `drivers`, `driver_compliance`, documents | `driver.onboarded`, `driver.suspended`, `driver.approved` | auth, notifications, vehicles |
| **trips** | Trip lifecycle derived from accepted assignment | trip state = `orders.dispatch_status` + `assignments` | `trip.started`, `trip.picked_up`, `trip.completed` | dispatch, booking, payments |
| **vehicles** | Vehicle registry + driver↔vehicle assignment | `vehicles`, `driver_vehicle_assignments` | `vehicle.assigned`, `vehicle.unassigned` | drivers |
| **customers** | Customer profiles | `customers` | `customer.created` | booking |
| **payments** | Payment intents, confirmation, splits, refunds, payouts | `payments`, split columns | `payment.completed`, `payment.refunded`, `payout.created` | booking, config, notifications |
| **notifications** | WhatsApp/n8n/email outbound, templating, language | `outgoing_messages`, `whatsapp_events`, conversation messages | `notification.sent`, `message.received` | chat, bookking, payments, shared(i18n) |
| **chat** | Support conversations, agents, AI handoff | `conversations`, `messages`, `support_agents`, `chat_sessions` | `conversation.started`, `conversation.escalated`, `conversation.closed` | notifications, ai, moderation |
| **ai** | Concierge engine (LLM responses, intent) | AI session state | `ai.responded`, `ai.escalated` | chat, notifications, config |
| **analytics** | Operational metrics, dashboards, intelligence | read models (views/aggregates) | — | all (read-only) |
| **settings** | Platform config (advance-booking-days, prices, toggles) | `settings` | `settings.changed` | config |
| **cases** | Compliance/legal cases, tasks, documents | `cases*`, `case_events`, `case_documents`, `case_tasks` | `case.opened`, `case.resolved` | drivers, auth |
| **hotels** | Hotels, rooms, promotions | `hotels`, `rooms`, `promotions`, `room_bookings` | `promotion.applied` | booking, settings |
| **ratings** | Testimonials, ratings | `ratings`, `conversation_ratings` | `rating.submitted` | customers |
| **moderation** | Profanity/URL/spam filtering | (stateless) | — | shared |
| **maps** | Geocoding, distance/ETA helpers | (stateless, calls Nominatim) | — | dispatch, shared |

## Ownership rules
- A domain **never** imports another domain's route handlers or UI.
- Cross-domain effects happen only via typed events (`EVENT_OWNERSHIP.md`).
- Each domain exposes: a service API (TS), its Drizzle schema, and its Zod validation.
- `analytics` is read-only and depends on published events, never on other domains' internals.

See `PACKAGE_MAP.md` for cross-cutting packages and `API_OWNERSHIP.md` for the API surface.
