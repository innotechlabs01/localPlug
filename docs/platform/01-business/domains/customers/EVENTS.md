# EVENTS (Customers)

## Events Produced

| Event | Producer | Payload | Consumers |
|-------|----------|---------|-----------|
| `customer.created` | CustomerService | customerId, name, email | Booking, Analytics, Notifications |
| `customer.updated` | CustomerService | customerId, changes | Analytics |
| `customer.deactivated` | CustomerService | customerId, reason | Analytics, Notifications |
| `customer.reactivated` | CustomerService | customerId | Analytics |
| `customer.merged` | CustomerService | primaryId, secondaryId | Analytics |

## Events Consumed

| Event | Source | Handler | Action |
|-------|--------|---------|--------|
| `booking.created` | Booking | CustomerBookingHandler | Update customer activity |
| `chat.conversation.ended` | Chat | CustomerChatHandler | Update customer activity |

## Event Schema

```typescript
interface CustomerCreatedEvent {
  type: 'customer.created'
  aggregateId: string // customerId
  payload: {
    customerId: string
    name: string
    email: string
    phone?: string
  }
}

interface CustomerMergedEvent {
  type: 'customer.merged'
  aggregateId: string // primaryId
  payload: {
    primaryId: string
    secondaryId: string
    mergedBy: string
  }
}
```

## Integration with Event Bus

- **Publisher**: Customers domain publishes via Event Bus (B10)
- **Outbox Pattern**: Events written to outbox table atomically
- **Consumers**: Booking, Analytics, Notifications, Chat subscribe
