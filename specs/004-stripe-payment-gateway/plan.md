# Implementation Plan: Stripe Payment Gateway

**Branch**: `004-stripe-payment-gateway` | **Date**: 2026-05-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-stripe-payment-gateway/spec.md`

## Summary

Integrate Stripe Payment Intents API into the existing multi-step booking wizard to allow
guests to pay for VIP packages. The system uses Stripe Elements (embedded card form),
processes one-time payments, prevents duplicate payments per booking, waits for Stripe
webhook confirmation before confirming, stores JSON payment records in an in-memory store
(consistent with existing booking-store pattern), and provides a payment status lookup
endpoint. No sensitive card data is stored locally — all PCI compliance is handled by Stripe.

## Technical Context

**Language/Version**: TypeScript 6 with strict mode

**Primary Dependencies**: Next.js 16 (App Router), Tailwind CSS v3, React 19,
stripe (Stripe Node.js SDK), @stripe/stripe-js (Stripe.js frontend),
@stripe/react-stripe-js (React components for Stripe Elements),
Vitest + React Testing Library

**Storage**: Stripe as external payment processor (Payment Intents API);
in-memory Map for JSON payment records (consistent with existing booking-store pattern);
no local storage of sensitive card data

**Testing**: Vitest + React Testing Library (payment flow, webhook handler,
payment record CRUD, duplicate prevention)

**Target Platform**: Modern web browsers (Chrome, Safari, Firefox, Edge — last 2
major versions)

**Project Type**: Web application — frontend card form embedded in existing booking
wizard, API endpoint for PaymentIntent creation, webhook handler, and payment status query

**Performance Goals**: Payment confirmation within 3 minutes (per SC-001);
payment status retrievable within 2 seconds of webhook processing (per SC-004);
webhook handler responds within 5 seconds to prevent Stripe timeouts

**Constraints**:
- No duplicate payments per booking — second payment attempt must be blocked
- No sensitive card data stored in application code, logs, or databases
- Webhook processing must be idempotent (keyed on Stripe event ID)
- Payment amount must match selected package server-side before creating PaymentIntent
- `__mock_fail` toggle (existing pattern) usable to simulate webhook failure
- Stripe test mode keys used for development; live keys for production

**Scale/Scope**: Single payment flow for VIP packages in the existing booking wizard;
no recurring billing, no refund management UI, no multi-currency (USD only MVP)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Next.js & React Best Practices
- Two new API routes (`/api/payments/create-intent`, `/api/payments/webhook`) follow
  App Router conventions
- `'use client'` for the Stripe Elements card form (requires browser APIs)
- Webhook route uses raw body parsing (Next.js `export const config = { api: { bodyParser: false } }`)
- **Status**: ✅ Pass (standard Next.js patterns, documented exception for raw body)

### Principle II — SEO-First Development
- Payment page is behind the booking wizard flow (not indexed)
- Webhook endpoint is internal (not indexed)
- No SEO impact; this principle does not apply
- **Status**: ✅ N/A (auth/session-gated flow)

### Principle III — Performance & Core Web Vitals
- Stripe.js loaded asynchronously via `@stripe/stripe-js` (non-blocking)
- Payment page is lightweight (no large images or media)
- Webhook handler is optimized (no heavy computation, minimal dependencies)
- **Status**: ✅ Pass

### Principle IV — Design System Compliance
- Payment card form and confirmation UI follow existing design tokens
  (Slate Navy, Mountain Emerald, Golden Sol, Cool Slate backgrounds)
- Typography matches Plus Jakarta Sans / Inter
- 8px base spacing, 8px default corner radii
- **Status**: ✅ Pass

### Principle V — TypeScript Strictness & Code Quality
- All new code is strict TypeScript with explicit types
- Stripe API types used where available; custom interfaces for payment records
- ESLint + Prettier configured
- No `console.log` in committed code (structured logging via logger)
- **Status**: ✅ Pass

### Principle VI — Accessibility (WCAG)
- Stripe Elements card form is inherently keyboard-accessible
- Error messages have `role="alert"` for screen readers
- Loading/processing states have `aria-live="polite"` announcements
- **Status**: ✅ Pass

### Principle VII — Testing & Validation
- Unit tests for payment record creation, duplicate prevention, amount validation
- Integration tests for webhook event handling (success + failure scenarios)
- Frontend tests for card form rendering, error display, success flow
- Lighthouse 90+ maintained on the booking page
- **Status**: ✅ Pass

### GATE RESULT: ✅ ALL PRINCIPLES PASS

## Project Structure

### Documentation (this feature)

```text
specs/004-stripe-payment-gateway/
├── plan.md              # This file
├── research.md          # Phase 0 — research decisions
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — developer quickstart
├── contracts/           # Phase 1 — interface contracts
│   ├── payment-api.md
│   └── webhook-contract.md
└── tasks.md             # Phase 2 — implementation tasks
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── payments/
│   │   ├── create-intent/
│   │   │   └── route.ts          # POST: Create Stripe PaymentIntent
│   │   └── webhook/
│   │       └── route.ts          # POST: Stripe webhook handler
│   └── payments/
│       └── status/
│           └── route.ts          # GET: Query payment status by booking ref
├── components/
│   └── booking/
│       ├── step-payment.tsx      # NEW: Payment step (Stripe Elements form)
│       ├── payment-form.tsx      # NEW: Stripe card form component
│       ├── payment-status.tsx    # NEW: Payment status display
│       ├── payment-confirmation.tsx # NEW: Post-payment confirmation
│       └── lib/
│           ├── stripe-client.ts  # NEW: Stripe.js initialization
│           ├── stripe-server.ts  # NEW: Stripe server-side helpers
│           ├── payment-store.ts  # NEW: In-memory payment record store
│           ├── types.ts          # UPDATED: Added payment-related types
│           └── payment-validation.ts # NEW: Amount validation, duplicate check

app/components/booking/__tests__/
├── payment-form.test.ts          # NEW: Payment form rendering + interaction
├── payment-webhook.test.ts       # NEW: Webhook handler tests
├── payment-store.test.ts         # NEW: Payment record store tests

.env.local                        # Stripe keys (gitignored)
```

**Structure Decision**: Web application with Next.js App Router. Payment logic follows
existing patterns: API routes in `app/api/`, client components in `app/components/booking/`,
shared lib in `app/components/booking/lib/`. Payment store (in-memory Map) follows the
exact same pattern as `booking-store.ts` from spec 003.

## Complexity Tracking

No Constitution Check violations found. This section intentionally left blank.
