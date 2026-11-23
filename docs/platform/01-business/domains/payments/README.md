# PAYMENTS DOMAIN

> Payment processing, invoices, refunds, subscriptions, and settlements.

## Responsibility
- Owns: invoices, transactions, refunds, subscriptions, checkout, webhooks, settlements
- Does NOT own: booking charges (Booking), hotel commissions (Hotels), driver payouts (Drivers)

## Boundaries
- Inbound: Booking (charge), Admin, API consumers
- Outbound: Notifications (payment status), Analytics (revenue), Hotels (commission)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 52%
- Extraction: Partial (3 duplicate implementations need consolidation)

## Domain Model
- Entities: Invoice, Transaction, Refund, Subscription, Checkout, Webhook, Settlement
- Value Objects: PaymentStatus, PaymentMethod, Currency, SplitType, SubscriptionStatus
- Aggregates: Invoice (root, invariants: amount consistency, split totals)
- Events: payment.initiated, payment.succeeded, payment.failed, payment.refunded, payout.created
- Policies: SplitCalculationPolicy, RefundPolicy, RetryPolicy, SettlementPolicy

## Provider Abstraction (NOT in this domain)
Providers are infrastructure: Paddle, Stripe, MercadoPago, DLocal, FastSpring.
This domain defines the contract, providers implement it.
