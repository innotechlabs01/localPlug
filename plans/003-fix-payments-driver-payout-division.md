# Plan 003: Fix Admin Driver Payout — Remove Erroneous Division by 100

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/api/admin/payments/route.ts lib/pricing.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The admin payments route divides `SUM(package_price)` from the `orders` table by 100, but `orders.package_price` is stored in **dollars** (confirmed: `lib/pricing.ts` returns `price: 89, 159, 269` and `getPackageTotal()` sums these values). This means the driverPayouts KPI is 1% of the true figure — e.g. $137 shows as $1.37. The `stripeBalance` calculation (`totalRevenue - driverPayouts`) is also corrupted as a result.

Note: `payments.amount` IS stored in cents (from Stripe), so the `/ 100` for `totalRevenue` at line 31 is correct. The bug is only on line 38 where `orders.package_price` is also divided by 100.

## Current state

`app/api/admin/payments/route.ts`, lines 20-21, 38-39:
```ts
// Line 20: SUM from payments table — paid in cents from Stripe, correct to /100
db.execute("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'")
// Line 21: SUM from orders table — stored in dollars, should NOT /100
db.execute("SELECT COUNT(*) as count, COALESCE(SUM(package_price), 0) as total FROM orders WHERE assigned_to IS NOT NULL")

// Line 31: CORRECT — payments.amount is in cents
const totalRevenue = Number(completedAgg.total) / 100

// Line 38: BUG — orders.package_price is in dollars, dividing by 100 gives ~1% of true value
const driverPayouts = Number(driverPayoutsAgg.total) / 100
```

Confirmation in `lib/pricing.ts`:
```ts
export const PACKAGES = {
  'smooth-landing': { name: 'The VIP Arrival', price: 89, priceCents: 8900 },
  'first-24': { name: 'The 24h Insider', price: 159, priceCents: 15900 },
  'full-insider': { name: 'The Peace of Mind', price: 269, priceCents: 26900 },
}
```
`getPackageTotal()` returns `price` (dollars), and this value is inserted into `orders.package_price` at `app/api/booking/route.ts:28,51`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |

## Scope

**In scope**:
- `app/api/admin/payments/route.ts` — line 38 only

**Out of scope**:
- The `totalRevenue` calculation (line 31) — `payments.amount` IS in cents, that `/ 100` is correct
- Any other files in the payments module
- The pricing module — the dollar/cents duality is by design

## Git workflow

- Branch: `fix/003-payments-driver-payout-division`
- Commit message: `fix: remove erroneous /100 on driverPayouts — orders.package_price is in dollars`
- Do NOT push or open a PR

## Steps

### Step 1: Remove the `/ 100` on driverPayouts

Change line 38 from:
```ts
const driverPayouts = Number(driverPayoutsAgg.total) / 100
```
to:
```ts
const driverPayouts = Number(driverPayoutsAgg.total)
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0
**Verify**: `pnpm lint` → exit 0

## Test plan

- Run `pnpm test` — all 57+ tests pass (no payments tests exist yet; those are Plan 007).
- Manual code inspection confirms no other dollar amounts from `package_price` are incorrectly divided.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] Line `Number(driverPayoutsAgg.total) / 100` no longer exists in `app/api/admin/payments/route.ts`
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The code at the cited lines doesn't match the excerpts.
- You discover evidence that `orders.package_price` IS stored in cents (e.g. from a migration file or INSERT statement showing cents values being written). If so, document your finding and stop.
- A verification fails twice.

## Maintenance notes

- The dollar-vs-cents dual representation (`price` vs `priceCents`) in `lib/pricing.ts` is intentional — `price` goes to `orders.package_price`, `priceCents` goes to Stripe.
- Reviewer: verify that `payments.amount` is stored in cents (from Stripe's API) and that the `totalRevenue / 100` line remains unchanged.
