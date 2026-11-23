# Workflow — Payment Flow

```
Trip completed
      ↓
Earning calculated (fare − commission)
      ↓
payment:earned  ──► driver earnings record
      ↓
Payout schedule aggregates earnings per driver
      ↓
payment:payout_scheduled → payment:payout_completed
```

## Rules
- Commission derived from booking total per configured rate.
- Earnings created on `trip:completed`; immutable (soft delete only).
- Payouts are batched per driver on a schedule (not per trip).

## Related
- Domain: `01-business/payments`
- State machine: `../07-state-machines/payment.md`
- Triggered by: `trip-flow.md`
