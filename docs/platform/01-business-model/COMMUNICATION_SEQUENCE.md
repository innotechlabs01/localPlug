# COMMUNICATION_SEQUENCE

> Flow sequences for key business events through the Communication Runtime.
> Shows the exact path from event to delivery.
> Last updated: 2026-07-11

---

## Generic Flow

Every event follows this path:

```
Domain Event
    ↓
EventBus
    ↓
CommunicationRuntime
    ↓
HandlerRegistry (lookup handler by event type)
    ↓
Handler.handle(event) → NotificationIntent
    ↓
PreferenceResolver (user preferences + quiet hours)
    ↓
TemplateRenderer (render message per channel)
    ↓
CommunicationRouter (select channels from MATRIX)
    ↓
Channel Provider (WhatsApp / Email / Push / In-App / WebSocket)
    ↓
DeliveryTracker (record delivery attempt)
    ↓
Metrics (increment counters)
```

---

## Sequence: Booking Confirmed

```
1. Booking Domain
   └─ publishes: booking.confirmed
       payload: { bookingId, reference, customerId, driverName, driverPhone }

2. EventBus
   └─ routes to: CommunicationRuntime

3. HandlerRegistry
   └─ lookup: BookingConfirmedHandler

4. BookingConfirmedHandler.handle(event)
   └─ returns: NotificationIntent {
       recipients: [customerId],
       templateId: 'booking-confirmed',
       payload: { reference, driverName, driverPhone },
       priority: 'high'
     }

5. PreferenceResolver
   └─ checks: customer.preferences.notifications.booking
   └─ checks: quietHours (current time vs customer.quietHours)
   └─ result: channels allowed = [whatsapp, email, inapp, websocket]

6. TemplateRenderer
   └─ render: 'booking-confirmed' × { whatsapp: template, email: template, inapp: template }

7. CommunicationRouter
   └─ matrix lookup: booking.confirmed → [whatsapp, email, push, inapp, websocket]
   └─ intersect with user prefs → [whatsapp, email, inapp, websocket]

8. WhatsApp Provider
   └─ send: Evolution API → customer phone
   └─ template: 'Tu reserva {reference} fue confirmada. conductor: {driverName}'

9. Email Provider
   └─ send: Resend → customer email
   └─ template: 'Booking Confirmation — {reference}'

10. In-App Provider
    └─ insert: notifications table
    └─ emit: notification.created

11. WebSocket Provider
    └─ broadcast: customer:{customerId} room
    └─ payload: { type: 'booking.confirmed', data: { reference } }

12. DeliveryTracker
    └─ record: whatsapp=delivered, email=delivered, inapp=delivered, websocket=delivered

13. Metrics
    └─ increment: communication.sent.total
    └─ increment: communication.sent.whatsapp
    └─ increment: communication.sent.email
    └─ increment: communication.sent.inapp
    └─ increment: communication.sent.websocket
```

---

## Sequence: Assignment Created (Driver Dispatch)

```
1. Dispatch Domain
   └─ publishes: assignment.created
       payload: { assignmentId, bookingId, driverId, priority: 'urgent' }

2. EventBus
   └─ routes to: CommunicationRuntime

3. HandlerRegistry
   └─ lookup: AssignmentCreatedHandler

4. AssignmentCreatedHandler.handle(event)
   └─ returns: NotificationIntent {
       recipients: [driverId],
       templateId: 'assignment-created',
       payload: { bookingId, pickupLocation, passengerName },
       priority: 'urgent'
     }

5. PreferenceResolver
   └─ checks: driver.preferences.notifications.assignment
   └─ result: channels allowed = [push, inapp, websocket]
   └─ NOTE: WhatsApp NOT used for assignments (too noisy)

6. CommunicationRouter
   └─ matrix: assignment.created → [push, inapp, websocket]
   └─ intersect → [push, inapp, websocket]

7. Push Provider (FCM)
   └─ send: Firebase Cloud Messaging → driver device
   └─ title: 'New Assignment'
   └─ body: 'Pickup at {pickupLocation}'

8. In-App Provider
   └─ insert: notifications table
   └─ emit: notification.created

9. WebSocket Provider
   └─ broadcast: driver:{driverId} room
   └─ payload: { type: 'assignment.created', data: { assignmentId } }

10. DeliveryTracker
    └─ record: push=delivered, inapp=delivered, websocket=delivered

11. Metrics
    └─ increment: communication.sent.push
    └─ increment: communication.sent.inapp
    └─ increment: communication.sent.websocket
```

---

## Sequence: Trip Completed

```
1. Trips Domain
   └─ publishes: trip.completed
       payload: { tripId, bookingId, driverId, customerId, distance, duration }

2. EventBus
   └─ routes to: CommunicationRuntime

3. HandlerRegistry
   └─ lookup: TripCompletedHandler

4. TripCompletedHandler.handle(event)
   └─ returns: NotificationIntent {
       recipients: [customerId, driverId],
       templateId: 'trip-completed',
       payload: { distance, duration, fare },
       priority: 'normal'
     }

5. PreferenceResolver
   └─ customer: channels = [whatsapp, email, inapp, websocket]
   └─ driver: channels = [push, inapp, websocket]

6. CommunicationRouter
   └─ matrix: trip.completed → [whatsapp, email, push, inapp, websocket]
   └─ customer intersect → [whatsapp, email, inapp, websocket]
   └─ driver intersect → [push, inapp, websocket]

7. Delivery (parallel)
   ├─ Customer: WhatsApp + Email + In-App + WebSocket
   └─ Driver: Push + In-App + WebSocket

8. After delivery:
   └─ Ratings Domain receives: trip.completed (separate event handler)
   └─ Analytics Domain receives: trip.completed (separate event handler)
```

---

## Sequence: Payment Failed

```
1. Payments Domain
   └─ publishes: payment.failed
       payload: { paymentId, bookingId, amount, error: 'card_declined' }

2. EventBus
   └─ routes to: CommunicationRuntime

3. HandlerRegistry
   └─ lookup: PaymentFailedHandler

4. PaymentFailedHandler.handle(event)
   └─ returns: NotificationIntent {
       recipients: [customerId],
       templateId: 'payment-failed',
       payload: { amount, error, retryUrl },
       priority: 'high'
     }

5. CommunicationRouter
   └─ matrix: payment.failed → [whatsapp, email, push, inapp, websocket]
   └─ user intersect → [whatsapp, email, push, inapp, websocket]

6. Delivery (parallel)
   ├─ WhatsApp: 'Payment failed for ${amount}. Please retry.'
   ├─ Email: 'Payment Failed — Action Required'
   ├─ Push: 'Payment failed — tap to retry'
   ├─ In-App: notification record
   └─ WebSocket: real-time update
```

---

## Sequence: Conversation Escalated (Chat → Cases)

```
1. Chat Domain
   └─ publishes: conversation.escalated
       payload: { conversationId, customerId, reason: 'ai_unable_to_resolve' }

2. EventBus
   └─ routes to: CommunicationRuntime

3. HandlerRegistry
   └─ lookup: ConversationEscalatedHandler

4. ConversationEscalatedHandler.handle(event)
   └─ returns: NotificationIntent {
       recipients: ['admin', 'support-team'],
       templateId: 'conversation-escalated',
       payload: { conversationId, customerName, reason },
       priority: 'high'
     }

5. CommunicationRouter
   └─ matrix: conversation.escalated → [whatsapp, push, inapp, websocket]
   └─ admin intersect → [whatsapp, push, inapp, websocket]

6. Delivery
   ├─ WhatsApp: alert to admin phone
   ├─ Push: 'Customer escalation — tap to review'
   ├─ In-App: notification in admin dashboard
   └─ WebSocket: real-time alert in admin room
```

---

## Sequence: Hotel Created

```
1. Hotels Domain
   └─ publishes: hotel.created
       payload: { hotelId, name, slug, contactEmail }

2. EventBus
   └─ routes to: CommunicationRuntime

3. HandlerRegistry
   └─ lookup: HotelCreatedHandler

4. HotelCreatedHandler.handle(event)
   └─ returns: NotificationIntent {
       recipients: [contactEmail],
       templateId: 'hotel-welcome',
       payload: { name, slug, dashboardUrl },
       priority: 'normal'
     }

5. CommunicationRouter
   └─ matrix: hotel.created → [email, inapp, websocket]
   └─ intersect → [email, inapp, websocket]

6. Delivery
   ├─ Email: 'Welcome to LocalPlug — {name}'
   ├─ In-App: notification in admin
   └─ WebSocket: real-time update
```

---

## Fallback Rules

| Failure | Action |
|---------|--------|
| WhatsApp fails | Retry 1x, then fallback to In-App |
| Email fails | Retry 1x, then log + alert monitoring |
| Push fails | Retry 1x, then In-App |
| In-App fails | Log + alert (should never fail) |
| WebSocket fails | Log (client reconnects) |

---

## Metrics Collected

| Metric | Type | Labels |
|--------|------|--------|
| `communication.sent.total` | counter | channel, event_type |
| `communication.delivered.total` | counter | channel, event_type |
| `communication.failed.total` | counter | channel, event_type, error |
| `communication.latency.seconds` | histogram | channel, event_type |
| `communication.cost.cents` | counter | channel, provider |
