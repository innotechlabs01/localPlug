# BUSINESS_CAPABILITY_DEPENDENCY_GRAPH

> The map of dependencies between capabilities.
> Shows who calls whom, who produces what, who consumes what.
> Last updated: 2026-07-11

---

## Dependency Rules

1. **Dependencies flow inward** — leaf capabilities don't depend on orchestrators
2. **Events decouple** — domains communicate via events, not direct calls
3. **Platform is infrastructure** — no business logic in platform code
4. **Applications consume domains** — never the reverse

---

## Core Flow (Primary Revenue)

```
Customer ──→ Booking ──→ Dispatch ──→ Drivers ──→ Trips
                │            │            │          │
                ↓            ↓            ↓          ↓
            Payments    Vehicles     Notifications  Ratings
                │                                         │
                ↓                                         ↓
            Hotels ◄─────────────────────────────────────┘
                │
                ↓
            Analytics
```

---

## Capability Dependency Matrix

### Who Produces What

| Capability | Produces Events | Consumed By |
|------------|----------------|-------------|
| **Booking** | booking.created, booking.confirmed, booking.cancelled, booking.completed | dispatch, payments, notifications, analytics, ratings |
| **Dispatch** | assignment.created, assignment.accepted, assignment.rejected | drivers, trips, booking, notifications, analytics |
| **Drivers** | driver.onboarded, driver.approved, driver.suspended, driver.available, driver.busy | dispatch, notifications, analytics |
| **Vehicles** | vehicle.registered, vehicle.assigned, vehicle.unassigned | drivers, analytics |
| **Trips** | trip.started, trip.location.updated, trip.completed, trip.cancelled | payments, notifications, analytics, customers, ratings |
| **Payments** | payment.initiated, payment.succeeded, payment.failed, payment.refunded, payout.created | booking, notifications, analytics, drivers |
| **Hotels** | hotel.created, hotel.updated, hotel.status.changed, hotel.manager.assigned, room.created, room.updated, commission.updated | booking, payments, notifications, analytics |
| **Customers** | customer.created, customer.updated, customer.deactivated | booking, analytics, notifications |
| **Chat** | conversation.created, message.sent, conversation.ended, conversation.escalated | ai, ratings, cases, notifications, analytics |
| **AI** | ai.response.generated, ai.confidence.scored, ai.escalated | chat, notifications, cases, analytics |
| **Ratings** | rating.submitted | hotels, analytics, drivers |
| **Cases** | case.opened, case.assigned, case.escalated, case.resolved | notifications, analytics |
| **Settings** | setting.updated, feature_flag.toggled | all (re-read config) |
| **Notifications** | notification.sent, notification.delivered, notification.failed | analytics, monitoring |
| **Analytics** | report.generated | notifications |

### Who Depends On What

| Capability | Depends On (Events) | Depends On (Services) |
|------------|--------------------|-----------------------|
| **Booking** | customer.created, hotel.created, payment.succeeded | Hotels, Customers, Payments |
| **Dispatch** | booking.created, driver.available | Drivers, Booking |
| **Drivers** | — | Auth |
| **Vehicles** | — | Drivers |
| **Trips** | assignment.accepted | Dispatch, Drivers |
| **Payments** | booking.created, trip.completed | Booking, Trips |
| **Hotels** | — | Auth |
| **Customers** | — | Auth |
| **Chat** | whatsapp.message.received, conversation.created | Communication, AI |
| **AI** | message.sent, conversation.created | Chat, Ollama, GPT-4o |
| **Ratings** | conversation.ended | Chat |
| **Cases** | conversation.escalated | Chat |
| **Settings** | — | Auth |
| **Notifications** | all domain events | Communication (WhatsApp, Email, SMS) |
| **Analytics** | all domain events | All domains (read-only) |

---

## Dependency Layers

### Layer 0: Foundation (no business dependencies)

```
Auth ─────────────────────────┐
Settings ─────────────────────┤
Communication (WhatsApp/Email)┘
```

### Layer 1: Core Entities (depend only on Layer 0)

```
Drivers ──────────────────────┐
Vehicles ─────────────────────┤
Customers ────────────────────┤
Hotels ───────────────────────┘
```

### Layer 2: Business Flow (depend on Layers 0-1)

```
Booking ──────────────────────┐
Payments ─────────────────────┤
Dispatch ─────────────────────┘
```

### Layer 3: Execution (depend on Layers 0-2)

```
Trips ────────────────────────┐
Chat ─────────────────────────┤
AI ───────────────────────────┘
```

### Layer 4: Intelligence (depend on Layers 0-3)

```
Ratings ──────────────────────┐
Cases ────────────────────────┤
Analytics ────────────────────┘
```

---

## Circular Dependency Check

| Pair | Status | Notes |
|------|:------:|-------|
| Booking ↔ Payments | ⚠️ | Booking creates payment, payment confirms booking. Use events. |
| Chat ↔ AI | ⚠️ | Tightly coupled. Extract AI from Chat carefully. |
| Booking ↔ Dispatch | ✅ | One-way: booking → dispatch via events |
| Drivers ↔ Dispatch | ✅ | One-way: dispatch → drivers via events |
| All → Notifications | ✅ | Fan-in: all domains produce, notifications consumes |
| All → Analytics | ✅ | Fan-in: all domains produce, analytics consumes |

---

## Extraction Order (by dependency depth)

Extract leaf dependencies first, then build outward:

| Priority | Capability | Why |
|:--------:|------------|-----|
| 1 | Hotels | Layer 1, no business deps, largest embedded domain |
| 2 | Customers | Layer 1, no business deps, schema fix needed |
| 3 | Ratings | Layer 4, depends only on Chat (already exists) |
| 4 | Cases | Layer 4, depends only on Chat (already exists) |
| 5 | Chat | Layer 3, depends on Communication (B11B) |
| 6 | AI | Layer 3, depends on Chat (extract together) |
| 7 | Analytics | Layer 4, read-only, depends on all (last) |
| 8 | Settings | Layer 0, high coupling, extract carefully |

---

## Event Flow Visualization

### Booking → Trip Flow

```
booking.created
    ├──→ dispatch: assignment.created
    │        ├──→ drivers: push notification
    │        └──→ trips: trip.created (等待 accepted)
    ├──→ notifications: booking confirmation
    └──→ analytics: booking metric

assignment.accepted
    ├──→ trips: trip.started
    ├──→ booking: booking.confirmed
    └──→ notifications: driver assigned

trip.completed
    ├──→ payments: payment.succeeded
    ├──→ notifications: trip completed
    ├──→ ratings: rating request
    └──→ analytics: trip metric

payment.succeeded
    ├──→ hotels: commission calculated
    ├──→ notifications: payment receipt
    └──→ analytics: revenue metric
```

### Chat → AI Flow

```
whatsapp.message.received
    └──→ chat: conversation.created / message.sent
         ├──→ ai: response.generated
         │        └──→ chat: message sent back
         └──→ (if escalated) cases: case.opened
              └──→ notifications: escalation alert

conversation.ended
    └──→ ratings: rating.submitted
         └──→ analytics: satisfaction metric
```

### Hotel Flow

```
hotel.created
    ├──→ notifications: welcome email
    └──→ analytics: hotel metric

room.created
    └──→ booking: room available

commission.updated
    └──→ payments: new commission rate

rating.submitted
    └──→ analytics: hotel quality score
```
