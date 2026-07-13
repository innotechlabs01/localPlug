# NOTIFICATION_EVENTS (Event Contract)

> Communication consumes domain events and produces integration events.
> This document defines the exact mapping.

---

## Inbound: Domain Events → Notification Intents

Communication subscribes to these B10 events:

### Booking Events

| Event | Handler | Template | Channels |
|-------|---------|----------|----------|
| `booking.created` | `BookingCreatedHandler` | `booking-created` | WhatsApp, InApp |
| `booking.confirmed` | `BookingConfirmedHandler` | `booking-confirmed` | WhatsApp, Email, Push, InApp |
| `booking.cancelled` | `BookingCancelledHandler` | `booking-cancelled` | WhatsApp, Email, InApp |

### Assignment Events

| Event | Handler | Template | Channels |
|-------|---------|----------|----------|
| `assignment.created` | `AssignmentCreatedHandler` | `assignment-created` | Push, InApp |
| `assignment.accepted` | `AssignmentAcceptedHandler` | `assignment-accepted` | WhatsApp, Push, InApp |
| `assignment.rejected` | `AssignmentRejectedHandler` | `assignment-rejected` | InApp |

### Trip Events

| Event | Handler | Template | Channels |
|-------|---------|----------|----------|
| `trip.started` | `TripStartedHandler` | `trip-started` | Push, InApp |
| `trip.completed` | `TripCompletedHandler` | `trip-completed` | WhatsApp, Email, Push, InApp |

### Payment Events

| Event | Handler | Template | Channels |
|-------|---------|----------|----------|
| `payment.succeeded` | `PaymentSucceededHandler` | `payment-succeeded` | WhatsApp, Email, InApp |
| `payment.failed` | `PaymentFailedHandler` | `payment-failed` | WhatsApp, Email, InApp |
| `payment.refunded` | `PaymentRefundedHandler` | `payment-refunded` | Email, InApp |

### Driver Events

| Event | Handler | Template | Channels |
|-------|---------|----------|----------|
| `driver.approved` | `DriverApprovedHandler` | `driver-approved` | WhatsApp, Push, InApp |
| `driver.suspended` | `DriverSuspendedHandler` | `driver-suspended` | WhatsApp, Email, InApp |

### Vehicle Events

| Event | Handler | Template | Channels |
|-------|---------|----------|----------|
| `vehicle.registered` | `VehicleRegisteredHandler` | `vehicle-registered` | InApp |

---

## Outbound: Integration Events

Communication produces these events after delivery:

```typescript
// Integration Events (Communication → Event Bus)
WHATSAPP_MESSAGE_SENT: 'whatsapp.message.sent'
WHATSAPP_MESSAGE_FAILED: 'whatsapp.message.failed'
EMAIL_DELIVERED: 'email.delivered'
EMAIL_BOUNCED: 'email.bounced'
NOTIFICATION_DELIVERED: 'notification.delivered'
NOTIFICATION_FAILED: 'notification.failed'
```

These events are consumed by:
- **Analytics**: Track delivery rates, costs
- **Audit**: Log all outbound communications
- **Monitoring**: Alert on failure spikes

---

## Event Handler Contract

```typescript
interface NotificationHandler {
  readonly eventType: string

  handle(event: DomainEvent): Promise<NotificationIntent | null>
}

interface NotificationIntent {
  recipients: Recipient[]
  templateId: string
  payload: Record<string, unknown>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  overridePreferences?: boolean
}
```

Handlers are lightweight. They:
1. Extract recipient information from event payload
2. Build a `NotificationIntent`
3. Return null if no notification needed

The engine handles routing, templates, and delivery.

---

## Handler Registry

```typescript
const handlerRegistry: Map<string, NotificationHandler> = new Map([
  [EventType.BOOKING_CREATED, new BookingCreatedHandler()],
  [EventType.BOOKING_CONFIRMED, new BookingConfirmedHandler()],
  [EventType.BOOKING_CANCELLED, new BookingCancelledHandler()],
  [EventType.ASSIGNMENT_CREATED, new AssignmentCreatedHandler()],
  [EventType.ASSIGNMENT_ACCEPTED, new AssignmentAcceptedHandler()],
  [EventType.ASSIGNMENT_REJECTED, new AssignmentRejectedHandler()],
  [EventType.TRIP_STARTED, new TripStartedHandler()],
  [EventType.TRIP_COMPLETED, new TripCompletedHandler()],
  [EventType.PAYMENT_SUCCEEDED, new PaymentSucceededHandler()],
  [EventType.PAYMENT_FAILED, new PaymentFailedHandler()],
  [EventType.PAYMENT_REFUNDED, new PaymentRefundedHandler()],
  [EventType.DRIVER_APPROVED, new DriverApprovedHandler()],
  [EventType.DRIVER_SUSPENDED, new DriverSuspendedHandler()],
  [EventType.VEHICLE_REGISTERED, new VehicleRegisteredHandler()],
])
```
