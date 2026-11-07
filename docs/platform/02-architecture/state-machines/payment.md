# State Machine — Payment (Earning)

```
          ┌──────────┐
          │ PENDING  │  on trip:completed
          └────┬─────┘
               │ earning recorded
               ▼
          ┌──────────┐
          │ EARNED   │  immutable record
          └────┬─────┘
               │ included in payout batch
               ▼
          ┌──────────┐
          │ SCHEDULED│  payout:payout_scheduled
          └────┬─────┘
               │ payout processed
               ▼
          ┌──────────┐
          │ PAID     │  payout:payout_completed
          └──────────┘
```

## Transitions
- `PENDING → EARNED`: earning calculated on completion.
- `EARNED → SCHEDULED`: added to a payout batch.
- `SCHEDULED → PAID`: payout completed.

## Guard rules
- Earnings immutable (soft delete only).
- Commission derived from booking total.
