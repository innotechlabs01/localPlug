# Business Domain — Payments

**Purpose:** Manage earnings, commissions, payouts, and financial records.

## Entities
- `Earning` — per-trip driver earning
- `Commission` — platform commission on a booking
- `Payout` — aggregated payout to a driver

## Events
- `payment:earned` (on trip completion)
- `payment:payout_scheduled`, `payment:payout_completed`

## Business Rules
- Earnings are calculated on `trip:completed`.
- Commissions are derived from booking total per configured rate.
- Payouts aggregate earnings per driver on a schedule.
- All financial records use soft deletes and audit timestamps.

## Related
- Workflow: `../../06-workflows/payment-flow.md`
- State machine: `../../07-state-machines/payment.md`
- Domain package: `packages/domains/payments`
