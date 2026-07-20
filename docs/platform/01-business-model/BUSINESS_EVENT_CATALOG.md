# BUSINESS_EVENT_CATALOG

> The single source of truth for ALL business events in the platform.
> Every domain speaks this language. No exceptions.
> Last updated: 2026-07-11

---

## Rules

1. **One publisher per event** — never duplicate ownership
2. **Additive only** — never remove or rename fields (add new versions)
3. **Business events** — happen in a domain, carry business meaning
4. **Integration events** — bridge external systems to the platform
5. **System events** — infrastructure concerns, no business meaning

---

## Business Events

### Booking Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `booking.created` | booking | bookingId, reference, customerId, hotelId, tripType, amount | dispatch, notifications, analytics, payments |
| `booking.confirmed` | booking | bookingId, reference, driverId | notifications, analytics, payments |
| `booking.cancelled` | booking | bookingId, reference, reason, cancelledBy | payments, notifications, analytics |
| `booking.status.changed` | booking | bookingId, previousStatus, newStatus | analytics |
| `booking.completed` | booking | bookingId, reference, tripId | payments, notifications, analytics, ratings |

### Dispatch Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `assignment.created` | dispatch | assignmentId, bookingId, driverId, priority | drivers, notifications, trips, analytics |
| `assignment.accepted` | dispatch | assignmentId, bookingId, driverId | trips, booking, notifications, analytics |
| `assignment.rejected` | dispatch | assignmentId, bookingId, driverId, reason | booking, analytics |

### Trips Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `trip.started` | trips | tripId, bookingId, driverId, origin | payments, notifications, analytics, customers |
| `trip.location.updated` | trips | tripId, lat, lng, speed, heading | customers (real-time) |
| `trip.completed` | trips | tripId, bookingId, driverId, distance, duration | payments, notifications, analytics, ratings |
| `trip.cancelled` | trips | tripId, bookingId, reason, cancelledBy | booking, analytics |

### Payments Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `payment.initiated` | payments | paymentId, bookingId, amount, method | analytics |
| `payment.succeeded` | payments | paymentId, bookingId, amount, method, transactionId | booking, notifications, analytics, hotels |
| `payment.failed` | payments | paymentId, bookingId, amount, error | booking, notifications, analytics |
| `payment.refunded` | payments | paymentId, bookingId, amount, reason | booking, notifications, analytics |
| `payout.created` | payments | payoutId, driverId, amount, period | drivers, analytics |

### Drivers Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `driver.onboarded` | drivers | driverId, name, phone | notifications, analytics |
| `driver.approved` | drivers | driverId | notifications, dispatch, analytics |
| `driver.suspended` | drivers | driverId, reason | notifications, analytics |
| `driver.available` | drivers | driverId, location | dispatch, analytics |
| `driver.busy` | drivers | driverId | dispatch, analytics |

### Vehicles Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `vehicle.registered` | vehicles | vehicleId, driverId, make, model | notifications, analytics |
| `vehicle.assigned` | vehicles | vehicleId, driverId | drivers, analytics |
| `vehicle.unassigned` | vehicles | vehicleId, driverId | drivers, analytics |

### Hotels Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `hotel.created` | hotels | hotelId, name, slug | notifications, analytics |
| `hotel.updated` | hotels | hotelId, changes | analytics |
| `hotel.status.changed` | hotels | hotelId, previousStatus, newStatus | notifications, analytics |
| `hotel.manager.assigned` | hotels | hotelId, managerId | notifications, analytics |
| `room.created` | hotels | roomId, hotelId, name, price | booking, analytics |
| `room.updated` | hotels | roomId, hotelId, changes | booking, analytics |
| `commission.updated` | hotels | hotelId, previousRate, newRate | payments, analytics |

### Customers Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `customer.created` | customers | customerId, name, email | booking, analytics, notifications |
| `customer.updated` | customers | customerId, changes | analytics |
| `customer.deactivated` | customers | customerId, reason | analytics |

### Chat Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `conversation.created` | chat | conversationId, customerId, channel | ai, notifications, analytics |
| `message.sent` | chat | messageId, conversationId, senderType, content | ai, analytics |
| `conversation.ended` | chat | conversationId, duration, messageCount | ratings, analytics |
| `conversation.escalated` | chat | conversationId, reason | cases, notifications, analytics |

### AI Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `ai.response.generated` | ai | responseId, conversationId, model, confidence | chat, analytics |
| `ai.confidence.scored` | ai | responseId, confidence, threshold | chat, analytics |
| `ai.escalated` | ai | conversationId, reason | chat, notifications, cases |

### Ratings Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `rating.submitted` | ratings | ratingId, conversationId, driverId, score | hotels, analytics, drivers |

### Cases Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `case.opened` | cases | caseId, conversationId, priority, type | notifications, analytics |
| `case.assigned` | cases | caseId, assigneeId | notifications, analytics |
| `case.escalated` | cases | caseId, level, reason | notifications, analytics |
| `case.resolved` | cases | caseId, resolution, duration | analytics |

### Settings Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `setting.updated` | settings | settingKey, previousValue, newValue | all (re-read config) |
| `feature_flag.toggled` | settings | flagName, previousState, newState | all (re-read flags) |

### Analytics Domain

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `report.generated` | analytics | reportId, type, period, url | notifications |

---

## Integration Events

### Communication (Inbound)

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `whatsapp.message.received` | evolution | instanceId, phone, message, timestamp | chat, notifications |
| `whatsapp.message.sent` | communication | messageId, instanceId, phone, status | analytics |
| `whatsapp.message.failed` | communication | messageId, instanceId, phone, error | analytics, monitoring |
| `email.delivered` | communication | messageId, email, status | analytics |
| `email.bounced` | communication | messageId, email, reason | analytics, monitoring |

### External Systems

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `webhook.received` | external | source, payload, signature | payments, notifications |
| `paddle.payment.webhook` | external | transactionId, status, amount | payments |
| `n8n.workflow.completed` | n8n | workflowId, status, output | chat, notifications |

### Evolution API

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `evolution.instance.connected` | evolution | instanceId, phone | notifications, monitoring |
| `evolution.instance.disconnected` | evolution | instanceId, phone | notifications, monitoring |

---

## System Events

| Event | Publisher | Payload | Consumers |
|-------|-----------|---------|-----------|
| `cache.invalidated` | system | key, region | all (re-read) |
| `feature.flag.changed` | system | flagName, previousState, newState | all (re-read) |
| `user.logged.in` | auth | userId, ip, userAgent | analytics, monitoring |
| `user.logged.out` | auth | userId | analytics |
| `migration.completed` | system | version, duration | monitoring |
| `health.check.failed` | system | service, error | monitoring, alerts |
| `circuit.breaker.opened` | system | service, failureCount | monitoring, alerts |
| `queue.processing.started` | system | queueName, depth | monitoring |
| `queue.processing.completed` | system | queueName, processed, duration | monitoring |

---

## Event Versioning

| Version | Changes | Date |
|---------|---------|------|
| 1.0.0 | Initial catalog — 35 business + 10 integration + 9 system events | 2026-07-11 |

### Rules
- New fields: add to payload (non-breaking)
- New events: add to catalog (additive)
- Breaking changes: create new event type (e.g., `booking.created.v2`)
- Never remove fields from existing events
- Never rename events
