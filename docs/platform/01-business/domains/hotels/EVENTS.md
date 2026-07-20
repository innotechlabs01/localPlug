# EVENTS (Hotels)

## Events Produced

| Event | Producer | Payload | Consumers |
|-------|----------|---------|-----------|
| `hotel.created` | HotelService | hotelId, name, slug | Notifications, Analytics |
| `hotel.updated` | HotelService | hotelId, changes | Analytics |
| `hotel.status.changed` | HotelService | hotelId, previousStatus, newStatus | Notifications, Analytics |
| `hotel.manager.assigned` | HotelService | hotelId, managerId, managerName | Notifications, Analytics |
| `hotel.manager.removed` | HotelService | hotelId, managerId | Notifications, Analytics |
| `room.created` | RoomService | roomId, hotelId, name, price | Booking, Analytics |
| `room.updated` | RoomService | roomId, hotelId, changes | Booking, Analytics |
| `room.status.changed` | RoomService | roomId, hotelId, previousStatus, newStatus | Booking, Analytics |
| `commission.updated` | CommissionService | hotelId, previousRate, newRate | Payments, Analytics |

## Events Consumed

| Event | Source | Handler | Action |
|-------|--------|---------|--------|
| `booking.created` | Booking | HotelBookingCreatedHandler | Update room availability |
| `booking.cancelled` | Booking | HotelBookingCancelledHandler | Restore room availability |
| `rating.submitted` | Ratings | HotelRatingHandler | Update hotel quality score |

## Event Schema

```typescript
interface HotelCreatedEvent {
  type: 'hotel.created'
  aggregateId: string // hotelId
  payload: {
    hotelId: string
    name: string
    slug: string
    contactEmail: string
  }
}

interface CommissionUpdatedEvent {
  type: 'commission.updated'
  aggregateId: string // hotelId
  payload: {
    hotelId: string
    previousRate: number
    newRate: number
    updatedBy: string
  }
}

interface RoomCreatedEvent {
  type: 'room.created'
  aggregateId: string // roomId
  payload: {
    roomId: string
    hotelId: string
    name: string
    pricePerNight: number
    capacity: number
  }
}
```

## Integration with Event Bus

- **Publisher**: Hotels domain publishes via Event Bus (B10)
- **Outbox Pattern**: Events written to outbox table atomically with business state
- **Consumers**: Booking, Payments, Notifications, Analytics subscribe
- **Correlation**: All events from same request share `correlationId`
