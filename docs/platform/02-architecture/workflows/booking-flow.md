# Workflow — Booking Flow

```
Customer submits request
      ↓
Validate pickup/dropoff + schedule (≥ 2h ahead)
      ↓
Price calculated (service fee + IVA)
      ↓
booking:created  ──► dispatch queue
      ↓
Payment verified (Paddle)
      ↓
booking:confirmed  ──► ready for dispatch
      ↓
[optional] Cancellation within 24h → fee
```

## Rules
- No booking without valid pickup/dropoff.
- Return trips require `return_date >= arrival_date`.
- Booking enters dispatch queue on creation; confirmation gates driver visibility.

## Related
- Domain: `01-business/booking`
- State machine: `../07-state-machines/booking.md`
