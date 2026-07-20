# EVENT_ARCHITECTURE (B10 — Canonical Event Model)

> **This document is the constitutional event model for LocalPlug as a Business Platform.**
> It defines what an event IS, who produces it, who consumes it, and how it flows.
> B10 implements the runtime that makes these events real.
>
> Companion: `packages/types/src/events/index.ts` (already defines event types — B10 wires the runtime).

---

## 1. Event Taxonomy

Every event in LocalPlug falls into exactly one of three categories. **Never mix these types.**

### Business Events
Domain-significant state changes. These are the "heartbeat" of the platform.
They represent facts: something happened.

| Event | Description |
|-------|-------------|
| `BookingCreated` | New booking submitted by customer |
| `BookingConfirmed` | Booking confirmed (admin or auto) |
| `BookingCancelled` | Booking cancelled |
| `AssignmentCreated` | Driver assigned to booking |
| `AssignmentAccepted` | Driver accepted the assignment |
| `AssignmentRejected` | Driver rejected the assignment |
| `TripStarted` | Driver picked up passenger |
| `TripCompleted` | Trip finished |
| `PaymentSucceeded` | Payment completed successfully |
| `PaymentFailed` | Payment processing failed |
| `PaymentRefunded` | Payment refunded |
| `DriverApproved` | Driver application approved |
| `DriverSuspended` | Driver suspended |
| `VehicleRegistered` | New vehicle added to fleet |
| `ExperienceBooked` | Experience/excursion booked |
| `RatingSubmitted` | Customer submitted rating |

### Integration Events
External system interactions. These represent bridges to/from the outside world.

| Event | Description |
|-------|-------------|
| `WhatsAppMessageReceived` | Incoming WhatsApp message from customer |
| `WhatsAppMessageSent` | Outgoing WhatsApp message delivered |
| `WhatsAppMessageFailed` | WhatsApp send failed |
| `EmailDelivered` | Email sent successfully |
| `EmailBounced` | Email delivery failed |
| `WebhookReceived` | Generic inbound webhook (n8n, Paddle, etc.) |
| `N8nWorkflowCompleted` | n8n workflow finished processing |
| `EvolutionInstanceConnected` | Evolution API instance connected |
| `EvolutionInstanceDisconnected` | Evolution API instance disconnected |
| `PaddlePaymentWebhook` | Paddle payment notification received |

### System Events
Infrastructure and operational events. Not business-meaningful, but critical for observability.

| Event | Description |
|-------|-------------|
| `CacheInvalidated` | Cache entry cleared |
| `FeatureFlagChanged` | Feature flag toggled |
| `UserLoggedIn` | User authenticated |
| `UserLoggedOut` | User session ended |
| `MigrationCompleted` | Database migration finished |
| `HealthCheckFailed` | Service health degraded |
| `CircuitBreakerOpened` | Circuit breaker tripped |
| `QueueProcessingStarted` | Message queue processing began |
| `QueueProcessingCompleted` | Message queue processing finished |

---

## 2. Event Ownership

**Every event has exactly ONE producer.** Two producers for the same event is a design failure.

| Event | Producer Domain | Consumers |
|-------|----------------|-----------|
| `BookingCreated` | Booking | Dispatch, Notifications, Analytics |
| `BookingConfirmed` | Booking | Dispatch, Notifications, Analytics |
| `BookingCancelled` | Booking | Dispatch, Payments, Notifications |
| `AssignmentCreated` | Dispatch | Trips, Notifications |
| `AssignmentAccepted` | Dispatch | Trips, Notifications, Analytics |
| `AssignmentRejected` | Dispatch | Dispatch (internal) |
| `TripStarted` | Trips | Dispatch, Notifications |
| `TripCompleted` | Trips | Payments, Analytics, Notifications |
| `PaymentSucceeded` | Payments | Booking, Analytics |
| `PaymentFailed` | Payments | Booking, Notifications |
| `PaymentRefunded` | Payments | Booking, Analytics |
| `DriverApproved` | Drivers | Notifications |
| `DriverSuspended` | Drivers | Notifications, Dispatch |
| `VehicleRegistered` | Vehicles | Drivers |
| `ExperienceBooked` | Experiences | Notifications, Analytics |
| `RatingSubmitted` | Ratings | Analytics |
| `WhatsAppMessageReceived` | Notifications | Chat, Analytics |
| `WhatsAppMessageSent` | Notifications | Analytics |
| `WhatsAppMessageFailed` | Notifications | Notifications (retry logic) |
| `EmailDelivered` | Notifications | Analytics |
| `WebhookReceived` | API Gateway | (routing to appropriate domain) |
| `N8nWorkflowCompleted` | Notifications | Chat, Analytics |
| `PaddlePaymentWebhook` | Payments | Booking |
| `CacheInvalidated` | System | (internal) |
| `FeatureFlagChanged` | System | (internal) |
| `UserLoggedIn` | Auth | Analytics |
| `HealthCheckFailed` | System | (alerting) |

---

## 3. Outbox Pattern

**This is the mechanism that breaks the `queue ↔ n8n` cycle.**

### The Flow

```
Application Service
    ↓
Repository
    ↓
Database Transaction
    ↓
Outbox (event written to outbox table IN THE SAME TRANSACTION)
    ↓
Commit
    ↓
Event Dispatcher (polls outbox or uses CDC)
    ↓
Event Bus
    ↓
Consumers (in order, each isolated)
```

### What this replaces

**Before B10 (current state):**
```
BookingService.createBooking()
    → direct fetch to n8n webhook
    → direct WhatsApp send via Evolution API
    → direct analytics update
    → if any fails → silent failure or retry logic scattered everywhere
```

**After B10:**
```
BookingService.createBooking()
    → writes booking + outbox event in same transaction
    → returns success immediately
    → Event Dispatcher picks up outbox event
    → EventBus routes to subscribers
    → Each subscriber handles its own concern independently
```

### Why the outbox pattern

1. **Atomicity**: Business state + event are written in the same transaction. No "wrote to DB but event lost" scenarios.
2. **Decoupling**: Service doesn't know who consumes the event. Adding a new consumer requires zero changes to the producer.
3. **Reliability**: Failed events are retried from the outbox. No silent failures.
4. **Ordering**: Events for the same aggregate are processed in order via `aggregateId` + `version`.

---

## 4. Event Bus

**The Event Bus does NOT execute business logic. It ONLY does routing.**

### Responsibilities
- Route events to registered handlers
- Support synchronous and asynchronous handlers
- Provide ordering guarantees per aggregate
- Emit metrics (published, consumed, failed, latency)

### Anti-patterns (never do this)
- ❌ Handler calls back into the producer domain
- ❌ Handler modifies the event payload
- ❌ Handler blocks the bus for other events
- ❌ Bus contains business logic

### Handler contract
```typescript
interface EventHandler<T> {
  eventType: EventType
  handle(event: DomainEvent<T>): Promise<void>
  onError?(event: DomainEvent<T>, error: Error): Promise<void>
}
```

### Handler isolation
Handlers never know about each other. A notification handler does not know that an analytics handler also processes the same event. This is enforced by the bus — handlers are registered independently and executed independently.

---

## 5. Idempotency

**Every event MUST carry these fields.** Even if you don't use them all today. In 2 years you'll be glad they're there.

### Required Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique event identifier |
| `type` | `EventType` | Event type (e.g., `BookingCreated`) |
| `version` | `number` | Schema version (starts at 1) |
| `aggregateId` | `string` | ID of the entity this event is about |
| `aggregateType` | `string` | Entity type (e.g., `booking`, `driver`) |
| `occurredAt` | `Date` | When the event happened (producer time) |
| `correlationId` | `string` | Groups events from the same user request |
| `causationId` | `string?` | ID of the event that caused this one |
| `producer` | `string` | Which domain produced this |
| `payload` | `T` | Event-specific data |

### Idempotency Key
The combination of `id` (event UUID) guarantees exactly-once processing. Consumers MUST check if an event with the same `id` has already been processed before executing side effects.

### Deduplication Strategy
```typescript
// In consumer:
const processed = await outboxRepository.findByIdempotencyKey(event.id)
if (processed) return // already handled
await handler.handle(event)
await outboxRepository.markProcessed(event.id)
```

---

## 6. Event Envelope

**All events share exactly the same structure.** No domain invents its own format.

```typescript
interface DomainEvent<T = unknown> {
  id: string                    // UUID v4
  type: EventType               // e.g., 'booking.created'
  version: number               // Schema version (starts at 1)
  aggregateId: string           // ID of the entity
  aggregateType: string         // 'booking' | 'driver' | 'payment' | ...
  occurredAt: Date              // When it happened
  correlationId: string         // Groups related events
  causationId?: string          // What caused this event
  producer: string              // 'booking' | 'dispatch' | 'payments' | ...
  payload: T                    // Event-specific data
}
```

### Event Type Naming Convention
- Format: `{domain}.{action}` (lowercase, dot-separated)
- Examples: `booking.created`, `assignment.accepted`, `payment.succeeded`
- Integration events: `{system}.{event}` (e.g., `whatsapp.message.received`)
- System events: `{system}.{event}` (e.g., `cache.invalidated`)

### Envelope Helpers
```typescript
// Create a typed event
function createEvent<T>(
  type: EventType,
  aggregateId: string,
  aggregateType: string,
  producer: string,
  payload: T,
  correlationId: string,
  causationId?: string
): DomainEvent<T>
```

---

## 7. Consumers

**Consumers never know about each other.**

### Good Pattern
```
BookingCreated
    ↓
    ├── Notification Handler (sends WhatsApp)
    ├── Analytics Handler (updates dashboard)
    └── Dispatch Handler (creates assignment)
```

Each handler:
- Receives the event independently
- Processes it independently
- Fails independently (does not block other handlers)
- Is registered independently (adding a handler changes no existing code)

### Anti-pattern
```
BookingCreated
    ↓
    Notification Handler
        ↓
        Analytics Handler  ← notifications knows about analytics? NO.
```

### Handler Registration
```typescript
// In notification module:
eventBus.on('booking.created', NotificationHandler)

// In analytics module:
eventBus.on('booking.created', AnalyticsHandler)

// In dispatch module:
eventBus.on('booking.created', DispatchHandler)
```

Adding a new consumer requires zero changes to the producer or existing consumers.

---

## 8. Event Versioning

**Think about this from day one.** Don't break consumers when the payload evolves.

### Strategy: Additive Changes
- New fields in payload: Version stays the same (v1). New fields are optional.
- Breaking field removal or rename: New version (v2). Old version continues to work during transition.

### Versioning Rules
1. **Never remove fields** from an existing version. Deprecate, then add in next version.
2. **Never rename fields** in an existing version. Add new field + deprecate old.
3. **Always make new fields optional** in the current version.
4. **Version bump** only when breaking changes are unavoidable.

### Example
```typescript
// v1 — current
interface BookingCreatedPayload {
  bookingId: number
  reference: string
  status: string
}

// v2 — future, additive
interface BookingCreatedPayloadV2 {
  bookingId: number
  reference: string
  status: string
  hotelId?: number          // new, optional
  returnDate?: string       // new, optional
}
```

### Consumer Compatibility
Consumers should be resilient to unknown fields:
```typescript
const { bookingId, reference, ...rest } = event.payload
// rest contains any new fields — ignore them gracefully
```

---

## 9. Observability

**The Event Bus MUST expose metrics.** This becomes critical as the platform grows.

### Metrics to Track

| Metric | Description | Where |
|--------|-------------|-------|
| `events.published` | Total events published | Event Bus |
| `events.consumed` | Total events consumed (per handler) | Event Bus |
| `events.failed` | Events that failed processing | Event Bus |
| `events.retried` | Events retried from outbox | Outbox Processor |
| `events.dlq` | Events sent to dead letter queue | Outbox Processor |
| `events.dispatch_latency_ms` | Average time from publish to handler completion | Event Bus |
| `events.outbox_depth` | Current outbox queue depth | Outbox Processor |
| `events.processing_time_ms` | Per-handler processing time | Event Handler |

### Implementation
```typescript
interface EventBusMetrics {
  published: number
  consumed: Record<string, number>  // per handler
  failed: number
  retried: number
  dlq: number
  avgDispatchLatencyMs: number
  outboxDepth: number
}
```

### Integration with DB Observability
B10 metrics integrate with `packages/db/src/observe.ts` for unified platform observability.

---

## 10. Implementation Plan (B10 Scope)

### What B10 Creates
1. `packages/events/` — Event bus runtime
   - `DomainEvent<T>` type (aligns with existing `packages/types/src/events`)
   - `EventBus` — routing, handler registration, metrics
   - `OutboxProcessor` — polls outbox table, dispatches to bus
   - `EventHandler<T>` — handler contract
2. `outbox_events` table — persists events in same transaction as business state
3. `EventHandler` interface — contract for all consumers
4. `EventBusMetrics` — observability

### What B10 Does NOT Create (deferred to B11+)
- Specific event handlers (B11: notifications, B12: API layer, etc.)
- n8n decomposition (B11 handles notification split)
- Socket.IO integration (B23)
- Real-time push to admin UI (B23)

### Migration Path
1. B10: Event bus + outbox runtime (no behavior change — events are written but not yet consumed)
2. B11: Notifications — first real consumer. WhatsApp + email + push subscribe to events.
3. B12: API layer — routes become thin orchestrators that emit events.
4. B23: Socket.IO — real-time push of events to admin UI.

---

## Appendix: Current State → B10 Mapping

| Current Pattern | Current File | B10 Event | Handler |
|----------------|-------------|-----------|---------|
| `triggerPaymentConfirmation()` | `lib/n8n/client.ts:121` | `payment.succeeded` | WhatsApp + n8n notification |
| `triggerDriverAssigned()` | `lib/n8n/client.ts:159` | `assignment.created` | WhatsApp + n8n notification |
| `triggerDeliveryCompleted()` | `lib/n8n/client.ts:203` | `trip.completed` | n8n workflow |
| `triggerAiChatMessage()` | `lib/n8n/client.ts:224` | `chat.message.sent` | n8n AI processing |
| `triggerEscalation()` | `lib/n8n/client.ts:249` | `conversation.escalation.requested` | n8n escalation |
| `triggerManagerCreated()` | `lib/n8n/client.ts:280` | `driver.approved` | WhatsApp + n8n |
| `triggerDriverNewAssignment()` | `lib/n8n/client.ts:404` | `assignment.created` | WhatsApp to driver |
| `triggerClientDriverConfirmed()` | `lib/n8n/client.ts:469` | `assignment.accepted` | WhatsApp to client |
| `sendWhatsAppDirect()` | `lib/n8n/client.ts:359` | `whatsapp.send.requested` | Evolution API handler |
| `processQueue()` | `lib/queue/whatsapp-worker.ts` | (replaced by OutboxProcessor) | (replaced by EventBus) |
| n8n webhook handler | `app/api/webhooks/n8n/route.ts` | `webhook.received` → domain events | Domain-specific handlers |
| Evolution webhook | `app/api/webhooks/evolution/route.ts` | `whatsapp.message.received` | Chat + Analytics |
| Chat send side effects | `app/api/chat/send/route.ts` | `chat.message.sent` | AI + Storage handlers |
