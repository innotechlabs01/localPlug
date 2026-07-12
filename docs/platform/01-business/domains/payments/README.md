# PAYMENTS DOMAIN

> Payment processing, splits, refunds, and financial records.

## Responsibility
- Owns: payment processing, payment splits, refunds, financial records
- Does NOT own: booking charges (Booking), hotel commissions (Hotels)

## Boundaries
- Inbound: Booking (charge), Admin, API consumers
- Outbound: Notifications (payment status), Analytics (revenue)

## Status
- Maturity: 52%
- Extraction: Partial (3 duplicate implementations need consolidation)
- Portal: None (Finance Portal planned)

## Domain Model
- **Entities**: Payment, PaymentSplit, Refund, PaymentMethod
- **Value Objects**: PaymentStatus, PaymentMethod, Currency, SplitType
- **Aggregates**: Payment (root: Payment, invariants: amount consistency, split totals)
- **Events**: payment.initiated, payment.succeeded, payment.failed, payment.refunded
- **Policies**: Split calculation, refund rules, retry logic

## Key Files
- `packages/domains/_services/src/payment.ts` — Domain service
- `lib/payment-service.ts` — Legacy implementation (needs consolidation)
- `app/api/payments/` — API routes
- `packages/db/src/domains/payments/` — DB schema

## Duplicate Implementations (Must Consolidate)
1. `lib/payment-service.ts` — 281L, legacy
2. `app/api/bookings/step-payment.tsx` — Server action, inline
3. `packages/domains/_services/src/payment.ts` — Domain service

## Extraction Plan
1. Consolidate 3 implementations into domain service
2. Add payment events
3. Create Finance Portal
