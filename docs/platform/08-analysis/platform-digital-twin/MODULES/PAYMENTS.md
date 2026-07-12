# Payments (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities
- **File:** `app/api/payments/create-intent/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` creates a Paddle transaction via `createTransaction` (`lib/paddle/server.ts`), using package price + grand total resolved from `lib/config.ts`/`lib/pricing.ts`.
  - ✔ Validates required fields and rejects invalid package ids (`getConfigPackagePriceCents === 0` → 400).
  - ✔ Duplicate guard: if `hasPayment` and existing status is `completed`/`pending` → 409 `duplicate_payment`.
  - ✔ Writes a `PaymentRecord` (status `pending`) to `payments` via `setPayment` (`lib/services/payment-service.ts`).
  - ✔ Rate-limited.
- **Problem (real coupling/ownership issue observed):** Route handler orchestrates pricing + Paddle + persistence + duplicate logic. It builds `PaymentRecord` inline (DTO construction in the controller). Cross-imports pricing, paddle, payment-service, config.

- **File:** `app/api/payments/confirm/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` takes `bookingReference` + `transactionId`, fetches the Paddle transaction via `getTransaction`, and if status ∈ {completed, paid, billed} writes a `completed` `PaymentRecord` via `setPayment`.
  - ✔ Falls back to existing record's fields when constructing the completed record.
  - ✔ Rate-limited.
- **Problem (real coupling/ownership issue observed):** Client-driven confirmation path that duplicates the webhook confirmation path. Does not update the `orders` row (unlike the webhook), so order status may stay `new` even though payment is completed — divergence from `webhooks/paddle`.

- **File:** `app/api/payments/status/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` returns a flattened `PaymentRecord` for a `bookingRef`; returns `{ status: 'no_payment' }` when none.
  - ✔ Rate-limited.
- **Problem (real coupling/ownership issue observed):** Read projection lives in a route; should be a query in a repository/service.

- **File:** `lib/services/payment-service.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `getPayment`, `setPayment` (INSERT OR REPLACE into `payments`), `hasPayment`, `hasCompletedPayment`, `hasPendingPayment` — thin DB wrappers.
  - ✔ `setPayment` normalizes legacy column names (`transaction_id`/`webhook_event_id`) to the new `paddle_*` names for backward compatibility.
- **Problem (real coupling/ownership issue observed):** This is a repository, not a "service". No business logic (refund, split, reconciliation) lives here despite the name. Column-name back-compat logic is embedded in the mapper.

- **File:** `lib/paddle/server.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `createTransaction` — builds Paddle transaction body, posts to `/transactions`; supports a default `product_id` from env.
  - ✔ `getTransaction` — GET `/transactions/{id}`.
  - ✔ `formatPaddleAmount` — cents → string.
  - ✔ `createPaddleRefund` — POST `/transactions/{id}/refund`.
  - ✔ Resolves Paddle base URL (prod vs sandbox) and API key from env.
- **Problem (real coupling/ownership issue observed):** SDK/transport adapter mixed with amount-formatting and env resolution. `formatPaddleAmount` treats input as already-in-cents but the comment/name is ambiguous; amount unit assumptions are scattered across callers.

- **File:** `lib/payment-record.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ Defines the `PaymentRecord` interface (`booking_reference`, `package_*`, `amount`, `currency`, `status`, `paddle_transaction_id`, `paddle_webhook_event_id`, customer fields, `error_message`, timestamps).
- **Problem (real coupling/ownership issue observed):** Type-only, but the persisted `payments` table has extra columns (`platform_fee_cents`, `hotel_payout_cents`, `split_status`, `refund_id`, `refund_reason`) NOT represented here, so the type is incomplete relative to the schema.

- **File:** `app/api/webhooks/paddle/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ Verifies `paddle-signature` header; unmarshals via `@paddle/paddle-node-sdk`.
  - ✔ Ignores everything except `transaction.completed`; on that event reads `custom_data.booking_reference`.
  - ✔ Computes platform fee / hotel payout split from `details.totals.total` and `getPlatformFeePercent()` (config), updates `payments` (status completed + split columns) only where currently `pending`.
  - ✔ Confirms the related `orders` row (`status='confirmed'`, `payment_status='paid'`).
  - ✔ Uses a manual `Paddle` client construction (separate from `lib/paddle/server.ts`).
- **Problem (real coupling/ownership issue observed):** Does reconciliation + split math + order confirmation inline in the webhook handler. Constructs the Paddle client directly rather than reusing `lib/paddle/server.ts`. The split-status logic (`pending`→`completed`) and order-confirm side effect are buried in the handler.

- **File:** `app/api/admin/payments/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` computes payment KPIs (revenue, success/failure rates, pending), `revenueByService` (group by `package_name`), last 50 `payments` transactions, and driver payouts (joins `orders`+`drivers`+`payments`).
  - ✔ Uses a hardcoded `DRIVER_PAYMENT_COP = 150000` constant for driver payout math and `convertCopToUsd` from `lib/trm.ts` with the live TRM rate.
  - ✔ Returns `trm` rate metadata.
- **Problem (real coupling/ownership issue observed):** Reporting endpoint owns KPI math, revenue grouping, payout computation, and a magic COP constant — none of which is configuration-driven or shared with the refund/split logic. Mixes read models with business constants.

- **File:** `app/api/admin/payments/refund/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `POST` refunds a completed payment by `booking_reference`: if a Paddle transaction id exists, calls `createPaddleRefund` then atomically (via `db.batch`) sets `payments.status='refunded'`, `orders.payment_status='refunded'`, and `payments.split_status='refunded'`.
  - ✔ Fallback "manual" refund path when no Paddle transaction id (still updates the same three tables).
  - ✔ Returns 409 if the first batch update affected 0 rows (double-refund guard).
- **Problem (real coupling/ownership issue observed):** Refund orchestration lives in the route and reaches across `payments` + `orders` + `split_status`. The manual-refund duplicate of the batch block is copy-pasted. Uses `createPaddleRefund` from `lib/paddle/server.ts` (good) but the Paddle client in the webhook is a different code path.

- **File:** `app/api/admin/payments/splits/route.ts`
- **Responsibilities (real, what the code actually does):**
  - ✔ `GET` aggregates split-payment summary from `payments` (total revenue, platform fees, hotel payouts, refunds, split statuses) and recent non-pending split transactions.
- **Problem (real coupling/ownership issue observed):** A second reporting read model over `payments` with its own aggregate SQL, duplicating concerns from `admin/payments/route.ts`.

## Module-level real responsibilities
- ✔ Create a Paddle payment intent and persist a pending `PaymentRecord`.
- ✔ Confirm a payment (client path + webhook path) and reconcile it to the order.
- ✔ Compute and store the platform-fee / hotel-payout split on completion.
- ✔ Refund a completed payment (Paddle + manual fallback) atomically across `payments` and `orders`.
- ✔ Expose payment KPIs, revenue-by-service, transaction list, driver payouts, and split summaries for the admin.
- ✔ Provide the `PaymentRecord` type and a Paddle transport adapter.

## Proposed split (target per Blueprint domains/packages)
- `PaymentService` / `PaymentIntentService` — create-intent + confirm orchestration (→ `packages/domains/payment`).
- `PaymentRepository` — `getPayment`/`setPayment`/`hasPayment*` from `lib/services/payment-service.ts` (→ `packages/db`).
- `PaymentRecord` type — extend to include `platform_fee_cents`, `hotel_payout_cents`, `split_status`, `refund_id`, `refund_reason` (→ `packages/domains/payment`).
- `PaddleGateway` — `lib/paddle/server.ts` transport + signature verification, reused by both webhook and refund (→ `packages/infra/paddle`).
- `PaymentWebhookHandler` — thin handler delegating to `PaymentReconciliationService` (split math + order confirmation) (→ `packages/domains/payment`).
- `PaymentSplitService` — fee/payout calculation moved out of the webhook; config-driven (→ `packages/domains/payment`).
- `RefundService` — single refund path (Paddle + manual) replacing the duplicated batch blocks (→ `packages/domains/payment`).
- `PaymentReportingService` / `PaymentReadModel` — KPIs, revenue-by-service, payouts, splits consolidated (→ `packages/domains/payment` or `packages/reporting`).
- `DriverPayoutService` — the `DRIVER_PAYMENT_COP` constant + COP→USD conversion should be config/exchange-driven, not hardcoded in an admin route (→ `packages/domains/payment` or `packages/domains/driver`).

## Dependency observations (real)
- `app/api/payments/*` import `@/lib/paddle/server`, `@/lib/services/payment-service`, `@/lib/payment-record`, `@/lib/rate-limit`, `@/lib/config`, `@/lib/pricing`.
- `app/api/webhooks/paddle/route.ts` imports `@/lib/db`, `@/lib/config` (`getPlatformFeePercent`), and constructs `Paddle` from `@paddle/paddle-node-sdk` directly (does NOT reuse `lib/paddle/server.ts`).
- `app/api/admin/payments/route.ts` imports `@/lib/trm` (`getTrmRate`, `convertCopToUsd`) — establishing the cross-domain FX dependency.
- `app/api/admin/payments/refund/route.ts` imports `@/lib/paddle/server` (`createPaddleRefund`) — so the SDK is used in two different flavors (direct `Paddle` in webhook vs `lib/paddle/server` in refund).
- `lib/services/payment-service.ts` imports `@/lib/db` (server-only) and `@/lib/payment-record` (types).
- `lib/paddle/server.ts` has no DB dependency (pure transport) — good isolation candidate.
- No payment file imports `lib/dispatch/*` or `lib/services/booking-service.ts`, but the webhook directly mutates `orders`, coupling payments to the order lifecycle imperatively.
