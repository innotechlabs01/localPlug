# DOMAIN MAP

> **Who owns what, how domains relate.**
> This is the organizational chart of the business.
> Technical implementations follow this map — never the other way around.

---

## Domain Ownership

```
                    ┌─────────────────────┐
                    │    LOCALPLUG         │
                    │  Business Operating  │
                    │      System          │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────┴────┐           ┌────┴────┐           ┌────┴────┐
   │ BOOKING │           │ TRIPS   │           │ PAYMENTS│
   │ DOMAIN  │──────────▶│ DOMAIN  │──────────▶│ DOMAIN  │
   └────┬────┘           └────┬────┘           └────┬────┘
        │                      │                      │
        │                      │                      │
   ┌────┴────┐           ┌────┴────┐           ┌────┴────┐
   │DISPATCH │           │ DRIVERS │           │ANALYTICS│
   │ DOMAIN  │◀──────────│ DOMAIN  │──────────▶│ DOMAIN  │
   └────┬────┘           └────┬────┘           └─────────┘
        │                      │
        │                      │
   ┌────┴────┐           ┌────┴────┐
   │VEHICLES │           │CUSTOMERS│
   │ DOMAIN  │           │ DOMAIN  │
   └─────────┘           └─────────┘
```

---

## Domain Catalog

| Domain | Responsibility | Key Entities | Events Produced |
|--------|---------------|--------------|-----------------|
| **Booking** | Reservation lifecycle, pricing, requests | Booking, Quote, Promotion | `booking.created`, `booking.confirmed`, `booking.cancelled` |
| **Dispatch** | Assignment engine, matching, queue | Assignment, Queue, Match | `assignment.created`, `assignment.accepted`, `assignment.rejected` |
| **Trips** | Trip lifecycle, transitions, completion | Trip, Route, Milestone | `trip.started`, `trip.completed` |
| **Drivers** | Registration, compliance, profile | Driver, Document, Performance | `driver.approved`, `driver.suspended` |
| **Vehicles** | Registry, fleet, categorization | Vehicle, Category | `vehicle.registered` |
| **Customers** | Profiles, history, preferences | Customer, Preference | — |
| **Payments** | Earnings, commissions, payouts | Payment, Commission, Payout | `payment.succeeded`, `payment.failed`, `payment.refunded` |
| **Notifications** | Push, WhatsApp, email, in-app | Notification, Template | `whatsapp.message.sent`, `email.delivered` |
| **Analytics** | Metrics, reporting, tracking | Metric, Report | — (read-only) |
| **Content** | Experiences, tours, curated services | Experience, Category | `experience.booked` |
| **Hotels** | Hotel partnerships, room integration | Hotel, Room, Promotion | — |
| **Chat** | AI concierge, human escalation | Conversation, Message | `chat.message.sent` |
| **AI** | GPT-4o integration, smart matching | — | — |
| **Ratings** | Customer feedback, driver scores | Rating | `rating.submitted` |
| **Cases** | Support tickets, tasks, documents | Case, Task, Document | — |

---

## Domain Dependencies

Dependencies flow downward only. No circular dependencies.

```
Booking ──────▶ Dispatch ──────▶ Trips
   │                │               │
   ▼                ▼               ▼
Payments         Drivers        Payments
   │                │
   ▼                ▼
Analytics       Vehicles
                   │
                   ▼
               Customers
```

### Dependency Rules
- **Booking** depends on: Dispatch (for assignment)
- **Dispatch** depends on: Drivers (for availability), Vehicles (for assignment)
- **Trips** depends on: Booking (for context), Dispatch (for assignment)
- **Payments** depends on: Booking (for amount), Trips (for completion)
- **Drivers** depends on: nothing (leaf domain)
- **Vehicles** depends on: nothing (leaf domain)
- **Customers** depends on: nothing (leaf domain)
- **Analytics** depends on: everything (read-only, no writes)
- **Notifications** depends on: nothing (receives events from all domains)

---

## Cross-Domain Communication

**Rule: Domains communicate through events, never direct calls.**

```
BookingService.createBooking()
    → emits: booking.created
    → Dispatch Handler: creates assignment
    → Notification Handler: sends WhatsApp
    → Analytics Handler: records metric
```

No domain calls another domain's service directly.
The event bus is the only cross-boundary communication channel.

---

## Aggregate Boundaries

Each domain owns exactly one aggregate root:

| Domain | Aggregate Root | Identity |
|--------|---------------|----------|
| Booking | `Booking` | UUID |
| Dispatch | `Assignment` | UUID |
| Trips | `Trip` | UUID |
| Drivers | `Driver` | UUID (Clerk ID) |
| Vehicles | `Vehicle` | UUID |
| Customers | `Customer` | UUID |
| Payments | `Payment` | UUID |
| Notifications | `Notification` | UUID |
| Hotels | `Hotel` | UUID |
| Experiences | `Experience` | UUID |

**Rule: No cross-aggregate queries.** If you need data from another aggregate, use events.
