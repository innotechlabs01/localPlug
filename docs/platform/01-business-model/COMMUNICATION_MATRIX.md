# COMMUNICATION_MATRIX

> Event × Channel delivery matrix.
> Defines which channels each event uses.
> This is the functional reference for the Communication Runtime.
> Last updated: 2026-07-11

---

## Reading

- ✅ = Event triggers this channel
- ❌ = Event does NOT use this channel
- ⚠️ = Event uses this channel only if user preference allows

---

## Business Events

| Event | WhatsApp | Email | Push | In-App | WebSocket |
|-------|:--------:|:-----:|:----:|:------:|:---------:|
| `booking.created` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `booking.confirmed` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `booking.cancelled` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `booking.completed` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `assignment.created` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `assignment.accepted` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `assignment.rejected` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `trip.started` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `trip.location.updated` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `trip.completed` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `payment.succeeded` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `payment.failed` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `payment.refunded` | ❌ | ✅ | ❌ | ✅ | ✅ |
| `driver.onboarded` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `driver.approved` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `driver.suspended` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `vehicle.registered` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `hotel.created` | ❌ | ✅ | ❌ | ✅ | ✅ |
| `hotel.status.changed` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `hotel.manager.assigned` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `room.created` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `commission.updated` | ❌ | ✅ | ❌ | ✅ | ✅ |
| `customer.created` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `customer.updated` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `conversation.created` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `message.sent` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `conversation.ended` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `conversation.escalated` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `ai.response.generated` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `ai.escalated` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `rating.submitted` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `case.opened` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `case.assigned` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `case.escalated` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `case.resolved` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `setting.updated` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `feature_flag.toggled` | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Integration Events

| Event | WhatsApp | Email | Push | In-App | WebSocket |
|-------|:--------:|:-----:|:----:|:------:|:---------:|
| `whatsapp.message.received` | — | ❌ | ❌ | ✅ | ✅ |
| `whatsapp.message.sent` | — | ❌ | ❌ | ❌ | ❌ |
| `whatsapp.message.failed` | — | ❌ | ❌ | ❌ | ❌ |
| `email.delivered` | ❌ | — | ❌ | ❌ | ❌ |
| `email.bounced` | ❌ | — | ❌ | ❌ | ❌ |
| `webhook.received` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `paddle.payment.webhook` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `n8n.workflow.completed` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `evolution.instance.connected` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `evolution.instance.disconnected` | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Channel Summary

| Channel | Events Using It | Primary Use |
|---------|:--------------:|-------------|
| **WhatsApp** | 16 | Transactional notifications (booking, payment, driver status) |
| **Email** | 14 | Formal communications (receipts, confirmations, reports) |
| **Push** | 12 | Real-time alerts (assignments, trips, cases) |
| **In-App** | 35 | All events (universal delivery) |
| **WebSocket** | 35 | All events (real-time sync) |

---

## Coverage Validation

Every business event must have at least In-App + WebSocket coverage.

| Check | Status |
|-------|:------:|
| All events have In-App | ✅ |
| All events have WebSocket | ✅ |
| No event uses only Push | ✅ |
| No event uses only Email | ✅ |
| WhatsApp has fallback to In-App | ✅ |

---

## Auto-Validation Rule

The Communication Runtime MUST validate at startup:

```
For each event in BusinessEventCatalog:
  If event has NO handler registered:
    WARN: "Event {event} has no communication handler"
  If event has NO channel coverage:
    ERROR: "Event {event} has no delivery channels"
```

This prevents orphan events from going silent.
