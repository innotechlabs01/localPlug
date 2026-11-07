# State Machine — Booking

```
          ┌──────────┐
          │ DRAFT    │  created (unpaid)
          └────┬─────┘
               │ payment verified
               ▼
          ┌──────────┐
          │ CONFIRMED│  visible to dispatch
          └────┬─────┘
       ┌───────┼────────────┐
       │ cancel(<24h fee)   │ dispatched
       ▼                    ▼
  ┌─────────┐         ┌────────────┐
  │CANCELLED│         │ IN_PROGRESS│ (trip active)
  └─────────┘         └─────┬──────┘
                             │ trip completed
                             ▼
                        ┌─────────┐
                        │COMPLETED│
                        └─────────┘
```

## Transitions
- `DRAFT → CONFIRMED`: payment verified.
- `CONFIRMED → CANCELLED`: cancellation (fee if < 24h).
- `CONFIRMED → IN_PROGRESS`: assignment accepted, trip created.
- `IN_PROGRESS → COMPLETED`: trip completed.

## Guard rules
- Schedule ≥ 2h in future at creation.
- Return trips: `return_date >= arrival_date`.
