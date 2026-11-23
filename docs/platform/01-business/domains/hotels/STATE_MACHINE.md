# STATE_MACHINE (Hotels)

## Entity: Hotel

### States
```
                    ┌──────────┐
                    │ pending  │
                    └────┬─────┘
                         │ activate
                         ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│inactive  │◄─────│  active  │─────►│suspended │
└──────────┘      └──────────┘      └──────────┘
     │                ▲
     │ deactivate     │ reactivate
     └────────────────┘
```

### Transitions

| From | To | Trigger | Guard | Side Effect |
|------|-----|---------|-------|-------------|
| pending | active | activate | Profile complete, rooms exist, manager assigned | Publish `hotel.status.changed` |
| active | inactive | deactivate | No active bookings | Publish `hotel.status.changed` |
| active | suspended | suspend | Policy violation | Publish `hotel.status.changed`, notify manager |
| inactive | active | reactivate | Profile still valid | Publish `hotel.status.changed` |
| suspended | active | reactivate | Violation resolved | Publish `hotel.status.changed` |

### Invalid Transitions
- pending → inactive: NEVER (must activate first)
- pending → suspended: NEVER (must activate first)
- inactive → suspended: NEVER (must be active)
- suspended → inactive: NEVER (must reactivate first)

### Persistence
- State stored in: `hotels.status`
- State changes are audited (hotel.updated event)

---

## Entity: Room

### States
```
┌──────────────┐      ┌──────────────┐
│  available   │◄─────│ unavailable  │
└──────┬───────┘      └──────────────┘
       │
       │ maintenance
       ▼
┌──────────────┐
│ maintenance  │
└──────────────┘
```

### Transitions

| From | To | Trigger | Guard | Side Effect |
|------|-----|---------|-------|-------------|
| available | unavailable | book | Room available, dates valid | Publish `room.status.changed` |
| unavailable | available | cancel | Booking cancelled | Publish `room.status.changed` |
| available | maintenance | setMaintenance | Hotel manager request | Publish `room.status.changed` |
| maintenance | available | endMaintenance | Maintenance complete | Publish `room.status.changed` |

### Invalid Transitions
- unavailable → maintenance: NEVER (must cancel booking first)
- maintenance → unavailable: NEVER (must end maintenance first)

---

## Entity: RoomBooking

### States
```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ pending  │─────►│confirmed │─────►│completed │
└──────────┘      └────┬─────┘      └──────────┘
                       │
                       │ cancel
                       ▼
                  ┌──────────┐
                  │cancelled │
                  └──────────┘
```

### Transitions

| From | To | Trigger | Guard | Side Effect |
|------|-----|---------|-------|-------------|
| pending | confirmed | confirm | Payment received | Publish `room.status.changed` |
| confirmed | completed | complete | Check-out date passed | Publish `room.status.changed` |
| confirmed | cancelled | cancel | Within cancellation window | Publish `room.status.changed` |

### Cancellation Window
- Free cancellation: 24 hours before check-in
- Partial refund: 50% if cancelled within 24 hours
- No refund: if cancelled after check-in
