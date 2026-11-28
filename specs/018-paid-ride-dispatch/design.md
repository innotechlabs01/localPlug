# 018 — Paid on-demand ride dispatch

## Roles
- Rider: creates an on-demand ride request and pays before any driver is contacted.
- Driver: receives offers only for rides whose payment is already confirmed.
- Platform: captures money at checkout and refunds automatically when no driver accepts.

## Acceptance criteria
1. `POST /api/rides/request` creates the order in `awaiting_payment`, creates a Polar checkout, and does **not** create driver assignments.
2. `order.paid` webhook marks the payment/order as paid and dispatches the nearest available driver.
3. Status polling and driver assignment polling never offer unpaid rides.
4. If no driver accepts within 90 seconds, the ride is cancelled and the captured amount is refunded through Polar.
5. A checkout paid after the ride was auto-cancelled is refunded immediately and never dispatched.
6. Cancelled-paid rides show a refund message; cancelled-unpaid rides show that no charge was made.
7. Every new behavior has a regression test.

## Out of scope
- Saved payment methods / delayed capture. Current provider flow is a hosted Polar checkout with immediate confirmation.
- Payout ledger changes. Driver liability still accrues at trip completion.
- Deploying to production.
