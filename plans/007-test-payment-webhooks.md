# Plan 007: Add Test Coverage for Stripe Payment Webhooks

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/api/webhooks/stripe/ app/api/payments/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

Five payment-related route files (~507 lines) handle real money flows — Stripe event signature verification, payment intent creation, payment confirmation, webhook event processing that triggers order creation and n8n notifications, and payment status lookups. Zero tests cover any of these. A bug in webhook signature parsing or payment intent status handling can silently:
- Double-charge customers
- Fail to confirm paid bookings (stranding customers)
- Create orders with wrong amounts
- Skip n8n notifications for driver dispatch

## Current state

**Files to test** (all untested):

| File | Lines | Role |
|------|-------|------|
| `app/api/webhooks/stripe/route.ts` | ~148 | Stripe event handler: verifies signature, handles `payment_intent.succeeded/failed`, creates orders, triggers n8n |
| `app/api/payments/webhook/route.ts` | ~156 | Nearly identical Stripe webhook duplicate |
| `app/api/payments/create-intent/route.ts` | ~97 | Creates Stripe payment intent with correct amount and metadata |
| `app/api/payments/confirm/route.ts` | ~66 | Retrieves Stripe intent, checks status, updates payment record |
| `app/api/payments/status/route.ts` | ~40 | Payment status lookup endpoint |

**Existing test pattern**: `tests/app/api/webhooks/n8n/route.test.ts` — uses Vitest with `vi.mock()` for `@/lib/db` and `@clerk/nextjs/server`. Model new tests after this pattern:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({ getDb: vi.fn() }))
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
```

**Convention**: This project uses `@/` path alias, `jsdom` test environment, and `@testing-library` for React tests.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Tests | `pnpm test` | all pass (old + new) |
| Run specific | `pnpm test -- tests/app/api/webhooks/stripe/` | targeted tests pass |

## Scope

**In scope**:
- Create `tests/app/api/webhooks/stripe/route.test.ts`
- Create `tests/app/api/payments/create-intent.test.ts`
- Create `tests/app/api/payments/confirm.test.ts`
- Create `tests/app/api/payments/status.test.ts`
- Create `tests/app/api/payments/webhook.test.ts` (or merge with stripe webhook test if they share logic)

**Out of scope**:
- Integration tests with real Stripe (unit tests only — mock Stripe SDK)
- Tests for admin payment routes (covered in Plan 008)
- The actual payment route files — do NOT modify production code
- E2E tests

## Git workflow

- Branch: `tests/007-payment-webhooks`
- Commit per logical unit; message style: conventional commits (`test: add Stripe webhook handler test suite`)
- Do NOT push or open a PR

## Suggested executor toolkit

- When writing Stripe webhook tests, mock `stripe.webhooks.constructEvent` and `stripe.paymentIntents.retrieve` from the `stripe` package.
- Use the existing pattern in `tests/app/api/webhooks/n8n/route.test.ts` as a reference for mocking `getDb()` and `auth()`.

## Steps

### Step 1: Create stripe webhook route test

Create `tests/app/api/webhooks/stripe/route.test.ts`. Mock:
- `@/lib/db` — `getDb()` returns a mock client with `execute()` that tracks calls
- `stripe` — `stripe.webhooks.constructEvent()` that can return a valid event or throw
- `@/lib/n8n/client` — `triggerPaymentConfirmation()`, `sendWelcomeWhatsAppMessage()`
- `@clerk/nextjs/server` — if used

Test cases:
1. **Missing Stripe signature header** → returns 400
2. **Invalid signature** (constructEvent throws) → returns 400
3. **Unhandled event type** (e.g. `charge.updated`) → returns 200 (should no-op)
4. **`payment_intent.succeeded`** with valid bookingRef → creates order, updates payment, triggers n8n, returns 200
5. **`payment_intent.succeeded`** with missing bookingRef → returns 400
6. **`payment_intent.payment_failed`** → updates payment record to failed, returns 200
7. **Database error** during processing → returns 500
8. **Duplicate event** (payment already processed) → returns 200 (idempotent)

**Verify**: `pnpm test -- tests/app/api/webhooks/stripe/` → all new tests pass

### Step 2: Create payment intent creation test

Create `tests/app/api/payments/create-intent.test.ts`. Mock the same dependencies plus `lib/pricing`.

Test cases:
1. **Valid request** with package and return transport → correct amount computed, Stripe API called with right metadata
2. **Missing body fields** → returns 400
3. **Duplicate payment** (payment already in progress for booking) → returns 409
4. **Stripe API error** → returns 502 or 500
5. **Unknown package ID** → returns 400 or computes correctly

**Verify**: `pnpm test -- tests/app/api/payments/` → all new tests pass

### Step 3: Create payment confirm and status tests

Create `tests/app/api/payments/confirm.test.ts` and `tests/app/api/payments/status.test.ts`.

Confirm tests:
1. **Successful retrieval** with completed payment → updates record, returns success
2. **Intent not found** (Stripe returns null) → returns 404
3. **Payment still processing** → returns 200 with pending status

Status tests:
1. **Valid booking reference** → returns payment status
2. **No payment found** → returns 404

**Verify**: `pnpm test -- tests/app/api/payments/` → all new tests pass

## Test plan

- All test files follow the existing test setup: Vitest + jsdom, `vi.mock()` for DB and external services.
- Total new test count: ~25-35 tests across 3-4 test files.
- Tests must not reach real network or Stripe — everything is mocked.
- Run full suite: `pnpm test` → all tests (old + new) pass.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0 with increased test count (57 + ~25-35 new)
- [ ] Each test file covers: success path, each error path, each edge case listed above
- [ ] No files outside the in-scope list are modified (no production code changes)
- [ ] All mocks use `vi.mock()` at the top level (not inside test bodies)

## STOP conditions

Stop and report back if:
- The Stripe webhook code has changed significantly since this plan was written (drift).
- The existing test pattern requires additional setup not described here.
- Mocking `stripe` (the npm package) at module level causes issues — use `vi.mock('stripe', () => ({ default: { webhooks: { constructEvent: vi.fn() } } }))` or try `vi.mock('stripe', () => ({ constructEvent: vi.fn() }))`.
- A verification fails twice.

## Maintenance notes

- These tests guard the payment flow. When Stripe API changes or webhook event shapes evolve, these tests will catch regressions.
- The `payments/webhook/route.ts` appears to be a near-duplicate of `webhooks/stripe/route.ts`. If one is removed/consolidated in the future, update or remove the corresponding test file.
- Reviewer: pay special attention to the Stripe signature verification mock — it should simulate real behavior (different event types, malformed payloads).
