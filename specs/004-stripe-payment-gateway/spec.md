# Feature Specification: Stripe Payment Gateway

**Feature Branch**: `004-stripe-payment-gateway`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "vamos a implementar stripe para hacer la pasarela de pago a usar, tener presente todas las hooks y validaciones pertinences, no permitimos mas de un pago si el pago no fue realizado esperamos que el hook responda, si hubo un error en el pago no se hace crea la orden ni nada, no se almacena registro de tarjeta ni nada todo lo hara stripe, tendremo un objecto donde guardaderos la información en modo json para saber notros que paquete tomo, estado de la transacción y seguimiento de esto, datos basicos para saber el usaurio quien es"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete VIP Package Payment (Priority: P1)

A guest who has completed the booking form and selected a VIP package proceeds to pay. The system presents a secure Stripe payment form, processes the payment, waits for Stripe's webhook confirmation, and upon success stores a JSON payment record with package details, transaction status, and basic guest information. The booking is confirmed only after webhook verification.

**Why this priority**: Payment completion is essential for monetization and is the primary user action in the booking flow.

**Independent Test**: Can be tested end-to-end by completing the booking wizard, selecting a VIP package, and simulating a successful Stripe payment via test card. The JSON payment record should be verifiable independently.

**Acceptance Scenarios**:

1. **Given** a guest has completed all booking steps and selected a VIP package, **When** they proceed to payment and enter valid card details on the Stripe form, **Then** the system shows a processing state, waits for Stripe webhook confirmation, and displays a success confirmation with their booking reference.

2. **Given** a payment has been successfully confirmed via webhook, **When** the system processes the webhook event, **Then** a JSON payment record is created containing packageId, packageName, amount, currency, transaction status (completed), Stripe PaymentIntent ID, customer email, and booking reference.

3. **Given** a guest reaches the payment step for an existing booking, **When** they attempt to pay, **Then** the system checks if a payment already exists for that booking and blocks duplicate payment attempts.

---

### User Story 2 - Handle Failed or Declined Payment (Priority: P1)

A guest attempts to pay but their card is declined or the payment fails. The system shows the error, does not create any order or payment record, and allows the guest to retry with a different payment method.

**Why this priority**: Preventing order creation on failed payments is critical for data integrity and avoids billing disputes.

**Independent Test**: Can be tested by using a Stripe test card that always declines. The system should show the error message and no payment JSON record should exist.

**Acceptance Scenarios**:

1. **Given** a guest is on the payment screen, **When** they submit a card that is declined by Stripe, **Then** the system displays a clear error message, does not create any order or payment record, and allows the guest to retry.

2. **Given** a guest's payment succeeded at Stripe but the webhook notification failed to reach the system, **When** a configurable timeout expires, **Then** the system logs the discrepancy and cancels the PaymentIntent to prevent incomplete orders.

3. **Given** a guest closes the browser during payment processing, **When** the webhook eventually arrives, **Then** the system still processes it and creates the JSON payment record if successful, or marks it as failed if not.

---

### User Story 3 - Track Payment Status (Priority: P2)

An administrator or the system needs to check the payment status for a given booking. The stored JSON record provides full transaction visibility including package details, current status, and Stripe identifiers.

**Why this priority**: Payment traceability is important for operations but is not needed for the initial payment flow to function.

**Independent Test**: Can be tested by completing a payment and then retrieving the JSON record via its endpoint, verifying all required fields are present and accurate.

**Acceptance Scenarios**:

1. **Given** a payment record exists in the system, **When** queried by booking reference, **Then** the system returns a JSON object containing packageId, packageName, transaction status, Stripe PaymentIntent ID, amount, currency, customer email, and timestamps.

2. **Given** multiple payment records exist, **When** queried, **Then** the system returns a list filtered by status or date range.

---

### Edge Cases

- What happens when the Stripe webhook arrives after the user has already closed the browser? The system should process the webhook asynchronously and update the payment record, so the next time the guest or admin checks the status, it reflects the correct state.
- How does the system handle duplicate webhook events from Stripe? Stripe may send the same event multiple times; the system must idempotently process webhooks based on Stripe event ID to avoid duplicate payment records.
- What happens if the payment amount does not match the selected package price? The system validates the amount server-side before creating the PaymentIntent and rejects mismatches.
- How does the system handle partial payment processing (e.g., user pays but amount is wrong)? The system only creates a PaymentIntent for the exact package amount and does not accept partial payments.
- What happens if the webhook service is down temporarily? Unprocessed webhooks should be queued or logged for retry; Stripe's automatic webhook retry mechanism handles delivery within 3 days.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate with Stripe Payment Intents API to securely process one-time payments for VIP packages. Payment forms must use Stripe Elements or Stripe Checkout to ensure PCI compliance.
- **FR-002**: System MUST prevent duplicate payments for the same booking. If a booking already has a completed payment record, subsequent payment attempts MUST be blocked with a clear message.
- **FR-003**: System MUST wait for Stripe webhook confirmation (payment_intent.succeeded) before marking a payment as completed. Frontend confirmation alone is insufficient.
- **FR-004**: If a Stripe webhook reports payment failure (payment_intent.payment_failed) or the PaymentIntent status is not "succeeded", the system MUST NOT create or confirm any order or payment record.
- **FR-005**: System MUST NOT store, log, or transmit raw card numbers, CVV, or any sensitive payment data. All card data handling MUST be done through Stripe's client-side Elements or Checkout.
- **FR-006**: System MUST store each payment as a JSON record containing at minimum: booking reference, selected package ID, package name, amount paid, currency, transaction status (pending/completed/failed), Stripe PaymentIntent ID, customer email, customer name, and ISO-8601 timestamps for creation and last update.
- **FR-007**: System MUST provide an endpoint to query payment status by booking reference, returning the JSON payment record when available or a clear "no payment found" response.
- **FR-008**: System MUST handle Stripe webhook events idempotently, using Stripe's webhook event ID to prevent duplicate processing.
- **FR-009**: System MUST validate payment amount server-side against the selected package price before creating a Stripe PaymentIntent, rejecting mismatches.

### Key Entities *(include if feature involves data)*

- **PaymentRecord**: A JSON-serialized object representing a single payment transaction. Key attributes include: bookingReference (unique identifier linking to the booking), packageId, packageName, amount, currency (default: USD), status (pending/completed/failed/refunded), stripePaymentIntentId, stripeWebhookEventId (last processed event), customerEmail, customerName, createdAt, updatedAt. Each booking may have at most one completed PaymentRecord.
- **PaymentSession**: A temporary representation of an in-progress payment. Created when the user initiates checkout, stores the Stripe clientSecret for frontend confirmation, and is resolved when the webhook arrives or the session expires.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests can complete a payment in under 3 minutes from the payment screen.
- **SC-002**: 100% of successful payments are verified via Stripe webhook before order confirmation — no "optimistic" successful payments.
- **SC-003**: Zero payment records are created for transactions where Stripe reports failure.
- **SC-004**: Payment status is retrievable within 2 seconds of webhook processing via the status endpoint.
- **SC-005**: No sensitive card data (PAN, CVV, track data) is stored in application databases, logs, or files — verified via automated scan.
- **SC-006**: Duplicate payment attempts for the same booking are blocked 100% of the time.
- **SC-007**: Stripe webhook events are processed idempotently with no duplicate payment records created under normal Stripe retry behavior.

## Assumptions

- Guests have already completed the booking wizard (flight logistics, traveler profile, destination) and selected a VIP package before reaching payment.
- The booking form already collects guest name and email, which are used for the payment record.
- Stripe test mode keys are used during development and staging; live keys for production.
- Stripe webhook endpoints are configured in the Stripe dashboard to point to the application's webhook URL.
- The system implements a timeout mechanism (e.g., 30-60 seconds) to handle cases where the webhook is delayed but the user expects confirmation.
- Standard Stripe webhook retry policy applies (automatic retries for up to 3 days).
- ISO 4217 currency codes are used, with USD as the default for VIP packages.
