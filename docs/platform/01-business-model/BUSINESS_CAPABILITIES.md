# BUSINESS_CAPABILITIES (Platform Capability Audit)

> Master audit of every business capability in LocalPlug.
> Answers for each: Is it a domain? Is it embedded in Admin? Does it have a portal? Maturity?
> Last updated: 2026-07-11

---

## Capability Matrix

| Capability | Domain Exists | Encapsulated in Admin | Has Portal | Future Portal | Maturity (0-5) | Priority |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|
| Booking | ✅ | Partially | No | Customer Portal | 4 | Done (B13) |
| Dispatch | ✅ | Partially | No | Admin (refactored) | 3 | Done (B14) |
| Drivers | ✅ | ✅ Yes | ✅ Driver Portal | — | 4 | Done (B15) |
| Hotels | ❌ No | ✅ Yes (embedded) | No | Hotel Portal | 2 | B28 |
| Customers | ❌ No | ✅ Yes (embedded) | No | Customer Portal | 2 | B18 |
| Payments | ✅ | Partially | No | Finance Portal | 3 | Done (B19) |
| Trips | ✅ | Partially | No | — | 2 | Done (B16) |
| Vehicles | ✅ | Partially | No | — | 2 | Done (B17) |
| Notifications | ✅ | ✅ Platform | No | — | 3 | B11A ✅ |
| Chat | ❌ No | ✅ Yes (embedded) | Widget only | Chat Admin | 3 | B29 |
| AI | ❌ No | ✅ Yes (embedded) | No | AI Console | 2 | B30 |
| Cases | ❌ No | ✅ Yes (embedded) | No | No | 2 | B31 |
| Ratings | ❌ No | ✅ Yes (embedded) | Widget only | No | 3 | B27 |
| Settings | ❌ No | ✅ Yes (embedded) | No | No | 3 | B21 |
| Analytics | ❌ No | ✅ Yes (embedded) | No | Analytics Portal | 2 | B20 |
| Partners | ❌ No | ❌ No | No | Partner Portal | 0 | Future |

### Maturity Scale
- **0**: Does not exist
- **1**: Concept only (docs/plans)
- **2**: CRUD exists, embedded in Admin, no domain service
- **3**: API + UI + basic service, but coupled to Admin routes
- **4**: Domain package with entities, services, repositories, events
- **5**: Full domain with portal, tests, observability, production-hardened

---

## Detailed Capability Analysis

### 1. BOOKING ✅ Maturity: 4

**Domain Package**: `packages/domains/booking/` (B13)

**What exists**:
- DB: `orders` table (20+ columns), `experience_bookings`
- API: `/api/booking` (POST), `/api/admin/orders`, `/api/admin/reservations`
- Domain: `BookingService` with entities, repository, state machine
- Events: `booking.created`, `booking.confirmed`, `booking.cancelled`
- Validation: `packages/validation/src/booking/`
- Types: `packages/types/src/domain/` (Booking interface)
- UI: Booking widget (customer), Admin orders/reservations pages

**What's still in Admin**:
- Admin orders page reads directly from DB (bypasses domain service)
- Admin reservations page reads directly from DB
- Hotel reference (`hotelId`) embedded in booking flow

**Gap**: Admin routes need to consume BookingService instead of direct DB access.

---

### 2. DISPATCH ✅ Maturity: 3

**Domain Package**: `packages/domains/dispatch/` (B14)

**What exists**:
- DB: `driver_availability`, `assignments` tables
- API: `/api/admin/dispatch`, `/api/assignments`
- Domain: `AssignmentService` (stub)
- Events: `assignment.created`, `assignment.accepted`, `assignment.rejected`
- UI: Admin dispatch page (real-time map + assignment)

**What's still in Admin**:
- Dispatch logic is mostly in the admin page component (client-side)
- Assignment creation happens in API route, not domain service
- Real-time updates via polling, not event-driven

**Gap**: Dispatch logic needs to move to domain service. Real-time should use Socket.IO.

---

### 3. DRIVERS ✅ Maturity: 4

**Domain Package**: `packages/domains/drivers/` (B15)

**What exists**:
- DB: `drivers`, `driver_documents`, `driver_performance`, `driver_availability` tables
- API: Full CRUD via admin routes
- Domain: `DriverService` with entities, repository
- Events: `driver.approved`, `driver.suspended`
- Portal: `apps/driver-portal/` (first new app)
- Validation: `packages/validation/src/driver/`

**What's still coupled**:
- Driver portal imports some admin components
- Document verification logic in API routes, not domain

**Gap**: Document verification should be a domain policy.

---

### 4. HOTELS ❌ Maturity: 2

**Domain Package**: None. Fully embedded in Admin.

**What exists**:
- DB: `hotels`, `rooms`, `promotions`, `room_bookings` tables (4 tables)
- API: 8 route files (~930 lines) — full CRUD for hotels, rooms, promotions, stats, manager assignment
- UI: 935-line admin page + booking step component (~2,890 lines total)
- Auth: `resolveHotelContext()` for tenancy boundary
- Services: `triggerManagerCreated()` in n8n client
- Config: `HOTEL_COMMISSION`, `HOTEL_REVENUE_NIGHT` settings
- i18n: ~24 translation keys per language

**What's embedded in Admin**:
- ALL hotel logic lives in `app/api/admin/hotels/` and `app/admin/hotels/`
- Commission formula duplicated in 4 locations
- Manager provisioning inline in API route (Clerk + DB + n8n)
- Hotel context resolution in `lib/admin/hotel-auth.ts`
- No domain service, no repository, no entities

**What a Hotel Domain needs**:
- `packages/domains/hotels/` with entities, services, repositories
- Commission calculation as domain policy (single source of truth)
- Manager provisioning as domain service
- Hotel context as domain concept, not admin utility
- Events: `hotel.created`, `hotel.manager.assigned`, `room.updated`, `promotion.created`

**Future Portal**: Hotel Portal (manager self-service)

---

### 5. CUSTOMERS ❌ Maturity: 2

**Domain Package**: None. Embedded in Admin.

**What exists**:
- DB: `customers` table (Drizzle schema vs raw SQL — SCHEMA DISCREPANCY)
- API: `/api/admin/customers` (full CRUD with auto-sync from orders)
- UI: Full admin page (~500 lines) with KPIs, detail panel, CSV export
- Types: `Customer` interface in `packages/types/` (but doesn't match DB schema)
- Events: `customer.created`, `customer.updated` defined in types

**Critical issues**:
1. **Two schemas coexist**: Drizzle schema has `clerkId`, `firstName`, `lastName`, `source`, `referralCode`. Raw SQL has `name` (single), `vip_level`, `lifetime_value`, `total_trips`. API uses raw SQL schema.
2. **Customer data denormalized in orders**: `customer_name`, `customer_email`, `customer_phone` stored directly in `orders` table.
3. **No domain service**: All customer logic in API route.
4. **syncCustomersFromOrders()**: Bootstraps customers from order data — should be an event handler.

**What a Customer Domain needs**:
- Reconcile Drizzle schema with actual DB schema
- `packages/domains/customers/` with entities, services, repositories
- Customer aggregate: profile, preferences, address book, trip history
- Events: `customer.registered`, `customer.profile.updated`, `customer.vip.escalated`
- Order denormalization cleanup (reference customerId, not embed name/email/phone)

**Future Portal**: Customer Portal (profile, bookings, preferences, support)

---

### 6. PAYMENTS ✅ Maturity: 3

**Domain Package**: `packages/domains/_services/src/payment.ts` (B19)

**What exists**:
- DB: `payments` table with split columns (platform_fee_cents, hotel_payout_cents)
- API: 7 route files (create-intent, confirm, status, admin CRUD, refund, splits, paddle webhook)
- Domain: `PaymentService` with full repository contract
- Events: `payment.succeeded`, `payment.failed`, `payment.refunded`
- External: Paddle integration (transaction, webhook, refund)
- Validation: `packages/validation/src/payment/`

**What's still duplicated**:
1. `lib/services/payment-service.ts` (monolith, snake_case)
2. `app/components/booking/lib/payment-store.ts` (duplicate, camelCase)
3. `packages/domains/_services/src/payment.ts` (domain service)
4. `packages/db/src/repositories/index.ts` (repository implementation)

**Gap**: Three payment libraries exist. Need to consolidate to domain service only.

---

### 7. CHAT ❌ Maturity: 3

**Domain Package**: None. Embedded across multiple locations.

**What exists**:
- DB: `conversations`, `messages`, `support_agents`, `chat_sessions`, `conversation_ratings` (5 tables, 3 migrations)
- API: 12 route files (start, send, messages, conversations, escalate, request-escalate, close, rating, agents, available, agent-me, ai-response)
- Services: `chat-service.ts` (289L), `agent-service.ts` (83L), `ollama-service.ts` (104L)
- UI: `ChatWidget.tsx` (876L), `admin/ia-chat/page.tsx` (951L)
- AI integration: n8n workflows, Ollama fallback, confidence-based escalation
- Fraud detection, blocked topics, moderation
- 6+ test files

**What's embedded in Admin**:
- IA Chat admin page is fully in `app/admin/ia-chat/`
- Agent management logic in API routes
- Chat service in `lib/services/` (not a domain package)

**What a Chat Domain needs**:
- `packages/domains/chat/` with conversation entity, message entity, agent entity
- Chat service as domain service
- Agent load balancing as domain policy
- Events: `conversation.started`, `message.sent`, `escalation.requested`, `agent.assigned`
- Separate AI concerns from chat domain

**Future Portal**: Chat Admin (standalone agent console)

---

### 8. AI ❌ Maturity: 2

**Domain Package**: None. Tightly coupled to Chat and WhatsApp.

**What exists**:
- Services: `ollama-service.ts` (local fallback), GPT-4o via WhatsApp service
- n8n: AI chat workflow, system prompts, escalation detection
- DB: `ai_confidence` on conversations, `sender_type = 'ai'` on messages
- Config: Ollama model config, confidence thresholds

**What's embedded**:
- AI logic split between `whatsapp-service.ts`, `ollama-service.ts`, `n8n/client.ts`
- System prompts hardcoded in service files
- Confidence scoring inline in chat send route

**What an AI Domain needs**:
- `packages/domains/ai/` with AI provider abstraction
- System prompt management as configuration
- Confidence scoring as domain policy
- Provider routing (n8n → Ollama → GPT-4o fallback chain)
- Events: `ai.response.generated`, `ai.escalation.triggered`

**Future Portal**: AI Console (prompt management, model selection, confidence tuning)

---

### 9. CASES ❌ Maturity: 2

**Domain Package**: None. Embedded in Admin.

**What exists**:
- DB: `cases`, `case_events`, `case_documents`, `case_tasks` (4 tables)
- API: 4 route files (CRUD + events/documents/tasks)
- UI: Case detail page (273L) with timeline, documents, tasks tabs
- No domain service, no types file, no repository

**What a Cases Domain needs**:
- `packages/domains/cases/` with case entity, event entity, document entity, task entity
- Case number generation as domain policy
- Status transitions as state machine
- Events: `case.created`, `case.escalated`, `case.resolved`

---

### 10. RATINGS ❌ Maturity: 3

**Domain Package**: None. Spread across chat and standalone.

**What exists**:
- DB: `ratings` table + legacy `conversation_ratings` table (2 tables)
- API: 3 routes (create, latest, stats) + chat rating endpoint
- Service: `rating-service.ts` (111L) with stats aggregation
- UI: 4 components (RatingsProvider, RatingForm, RatingCard, RatingStats)
- Comment moderation via `filterComment`

**What's duplicated**:
- Two rating tables: `ratings` and `conversation_ratings`
- Two rating endpoints: `/api/ratings` and `/api/chat/rating`

**What a Ratings Domain needs**:
- Consolidate to single rating table
- `packages/domains/ratings/` with rating entity, stats service
- Events: `rating.submitted`, `rating.resolved`

---

### 11. SETTINGS ❌ Maturity: 3

**Domain Package**: None. Config lives in `lib/settings.ts`.

**What exists**:
- DB: `settings` table (key-value)
- API: `/api/admin/settings` (GET/PUT)
- Service: `lib/settings.ts` (317L) with 32 typed keys, caching
- UI: Admin settings page (553L) with 11 sections
- Config: `packages/config/` (env validation)

**What's coupled**:
- `lib/settings.ts` is imported by booking, payment, chat, rate limiter
- Settings page directly upserts DB, bypasses domain logic
- No validation on settings updates (type safety gap)

**What a Settings Domain needs**:
- `packages/domains/settings/` with settings entity, validation rules
- Settings changes as events (audit trail)
- Events: `setting.changed`, `pricing.updated`

---

### 12. ANALYTICS ❌ Maturity: 2

**Domain Package**: None. All queries inline in API route.

**What exists**:
- API: `/api/admin/analytics` (114L) with 8 parallel SQL queries
- UI: Admin analytics page (589L) with SVG charts
- No domain service, no repository, no types

**What an Analytics Domain needs**:
- `packages/domains/analytics/` with read models, query builders
- Materialized views or caching for expensive queries
- Events: `analytics.snapshot.created`

**Future Portal**: Analytics Portal (standalone dashboards)

---

### 13. NOTIFICATIONS ✅ Maturity: 3

**Domain Package**: `packages/communication/` (B11A ✅)

**What exists**:
- Architecture contract: 10 docs defining the full notification system
- Runtime: Pending (B11B)
- Current: `lib/n8n/client.ts` (575L god module) handles all notifications

**Gap**: Runtime implementation (B11B) — handlers, providers, template engine, n8n decomposition.

---

## Extraction Priority Order

Based on the audit, here's the recommended extraction order:

| Priority | Capability | Reason | Backlog ID |
|----------|-----------|--------|------------|
| 1 | Hotels | Largest embedded domain (4 tables, 8 APIs, 935L page) | B28 |
| 2 | Customers | Schema discrepancy, denormalization, 2-table problem | B18 |
| 3 | Chat | 12 APIs, 5 tables, most complex, AI coupling | B29 |
| 4 | AI | Tightly coupled to Chat, needs separate abstraction | B30 |
| 5 | Cases | Clean boundaries, 4 tables, straightforward | B31 |
| 6 | Ratings | 2 duplicate tables, needs consolidation | B27 |
| 7 | Settings | Simple key-value, but high coupling | B21 |
| 8 | Analytics | Read-only, can be extracted last | B20 |

---

## Cross-Cutting Concerns

### Hotel References Across Domains

The `hotelId` field appears in:
- `orders` table (booking references hotel)
- `room_bookings` table (hotel room reservations)
- `experience_bookings` table (experiences at hotels)
- `users` table (hotel manager assignment)
- `payments` table (hotel payout split)
- Booking validation schemas
- Dispatch search (hotel name)
- Admin dashboard (hotel metrics)

This confirms Hotels is a cross-cutting domain that other domains reference but don't own.

### Customer Data Denormalization

Customer data (`name`, `email`, `phone`) is embedded in:
- `orders` table
- `payments` table
- `room_bookings` table
- `ratings` table
- `conversations` table

This is a platform-wide issue. The Customer Domain should own this data, and other domains should reference `customerId`.

### Payment Duplication

Three payment implementations exist:
1. `lib/services/payment-service.ts` (legacy, snake_case)
2. `app/components/booking/lib/payment-store.ts` (duplicate, camelCase)
3. `packages/domains/_services/src/payment.ts` (domain service)

Consolidation to #3 is required.

---

## Recommendations

1. **Hotels first**: Extract to `packages/domains/hotels/` before B11B. The commission formula duplication alone justifies this.

2. **Customer schema reconciliation**: Resolve Drizzle schema vs raw SQL discrepancy before extracting Customer domain.

3. **Chat + AI together**: These are too coupled to extract separately. Consider `packages/domains/concierge/` covering both.

4. **Payment consolidation**: Delete `lib/services/payment-service.ts` and `app/components/booking/lib/payment-store.ts` after confirming domain service works.

5. **Hotel Portal is future**: Don't build it until Hotel Domain is extracted and stable. Same pattern as Driver Portal.
