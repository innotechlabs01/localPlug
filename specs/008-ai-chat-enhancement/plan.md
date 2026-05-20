# Implementation Plan: AI Chat Enhancement + Unified n8n Business Workflow + i18n Audit

**Branch**: `008-ai-chat-enhancement` | **Date**: 2026-05-17 | **Spec**: `specs/008-ai-chat-enhancement/spec.md`

**Input**: Feature specification from `specs/008-ai-chat-enhancement/spec.md`

## Summary

Replace mock AI with real n8n AI responses and audit i18n coverage across all chat text (already implemented in previous session). Broaden scope to add a single unified n8n workflow that handles WhatsApp notifications via Twilio for three post-payment milestones: payment confirmation, driver assignment, and delivery completion. The app passes event data to n8n; n8n owns all WhatsApp sending via its built-in Twilio node.

## Technical Context

**Language/Version**: Next.js 16+ with App Router, TypeScript strict mode

**Primary Dependencies**: `@libsql/client` (Turso driver), `stripe` (server SDK), `@stripe/stripe-js` (client SDK), existing i18n React Context

**Storage**: Turso (libSQL) — existing `payments` table needs `customer_phone` column added via migration `008_whatsapp_phone.sql`; existing `conversations` table

**Testing**: `pnpm build` (TS check), manual verification via Stripe webhook triggers and n8n workflow logs

**Target Platform**: Vercel (Next.js SSR + API routes), n8n instance at `https://agent-ia.innotechlabssas.lat`

**Project Type**: Web application (Next.js App Router) + n8n workflow automation

**Performance Goals**: WhatsApp trigger-to-notify latency <30s; no client-side impact (all WhatsApp logic runs in n8n)

**Constraints**:
- WhatsApp Business Cloud API via Twilio — all Twilio credentials stored in n8n, NOT in app .env
- WhatsApp outbound messages require pre-approved templates for business-initiated conversations (utility category: `payment_confirmed`, `driver_assigned`, `delivery_completed`)
- Stripe webhook `payment_intent.succeeded` already processed by app → app forwards to n8n. Adding phone field to payload.
- No existing `orders` table in migrations — `conversations.order_id` FK references `orders(id)` but table is not created via migrations (separate concern, out of scope)
- Driver assignment logic remains 100% in the app — n8n only sends WhatsApp when app emits event

**Scale/Scope**: Single unified n8n workflow covering AI chat responses + 3 WhatsApp notification events

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status |
|------|--------|
| I. Next.js & React Best Practices | ✅ PASS — WhatsApp triggers are server-side API routes; no RSC violations |
| II. SEO-First Development | ✅ PASS — No UI/page changes |
| III. Performance & Core Web Vitals | ✅ PASS — All new work is server-side/background; no client impact |
| IV. Design System Compliance | ✅ PASS — No UI changes |
| V. TypeScript Strictness & Code Quality | ✅ PASS — Must maintain `strict: true`, no `any` |
| VI. Accessibility (WCAG) | ✅ PASS — No UI changes |
| VII. Testing & Validation | ⚠️ FLAG — Must add request validation and error handling for new event API routes |
| VIII. Admin Dashboard & Customer Support | ✅ PASS — WhatsApp integration directly improves customer support |
| IX. Real-Time Communication | ✅ PASS — WhatsApp is an async complement to the existing chat widget |

**Gate Decision**: PASS with flag — testing required for new API routes.

## Project Structure

### Documentation (this feature)

```text
specs/008-ai-chat-enhancement/
├── plan.md              # This file
├── spec.md              # Feature specification (clarified)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
lib/
├── n8n/
│   └── client.ts            # +triggerDriverAssigned(), +triggerDeliveryCompleted()
│                             # +customer_phone in triggerPaymentConfirmation()

app/
├── api/
│   ├── payments/
│   │   └── webhook/
│   │       └── route.ts     # Pass customer_phone to n8n triggerPaymentConfirmation
│   ├── webhooks/
│   │   └── n8n/
│   │       └── route.ts     # Handle driver-assigned + delivery-completed callbacks
│   └── bookings/
│       └── [events]/
│           └── route.ts     # New: driver-assigned and delivery-completed events

lib/db/migrations/
└── 008_whatsapp_phone.sql   # New: ALTER TABLE payments ADD COLUMN customer_phone

app/components/booking/lib/
├── payment-store.ts         # +customer_phone field in getPayment/setPayment
└── types.ts                 # +customerPhone in PaymentRecord
```

## Complexity Tracking

No violations — all work follows existing patterns (extending n8n client, adding DB migrations, creating event API routes).

## Phase 0: Research

### Unknowns Resolved

1. **Twilio WhatsApp setup in n8n**: n8n has built-in Twilio node (SMS/WhatsApp). Auth via Account SID + Auth Token or API Key. All credentials stored in n8n instance, not in app. Twilio WhatsApp Sandbox available for dev testing.

2. **WhatsApp message templates**: Business-initiated messages require pre-approved utility templates (`payment_confirmed`, `driver_assigned`, `delivery_completed`) created in Twilio Content Template Builder. Templates need EN + ES variants.

3. **Stripe webhook → n8n routing**: Keep current architecture (Stripe → app webhook → n8n). App already verifies Stripe signatures, stores payment records, and calls n8n. Adding phone number to the payload is the only change needed.

4. **Customer phone storage**: No phone field in `payments` table. Need migration `008_whatsapp_phone.sql` to add `customer_phone TEXT`. The phone number comes from the booking flow (metadata sent to Stripe Checkout or collected at booking time).

5. **App event emission for driver/delivery**: No event bus exists. Use direct `sendN8nWebhook()` calls from new API routes. Create `POST /api/bookings/driver-assigned` and `POST /api/bookings/delivery-completed` endpoints that validate input and forward to n8n.

6. **Existing Stripe webhook handler** (`app/api/payments/webhook/route.ts`): Currently processes `payment_intent.succeeded` and calls `triggerPaymentConfirmation`. Needs to also extract `customerPhone` from `intent.metadata.customerPhone` and include it in the n8n payload.

### Architecture Decision Records

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WhatsApp provider | Twilio (WhatsApp Business Cloud API) | n8n has built-in Twilio node, no app dependencies, proven reliability |
| Twilio credential location | n8n instance only | Keeps app .env clean; n8n manages Twilio auth centrally |
| Stripe webhook routing | App → n8n (keep existing) | App already verifies signatures and stores payments; adding phone to payload is minimal change |
| Event emission pattern | Direct n8n webhook call | No event bus infrastructure; n8n client already exists and is simple |
| Phone number storage | `payments.customer_phone` column | Cleanest approach — phone comes via booking metadata → Stripe → webhook; already have the payment record |
| WhatsApp message type | Pre-approved utility templates via Twilio Content API | Required by Meta for business-initiated messages; utility category is free within 24h window |
| Single n8n workflow | One workflow with multiple webhook triggers | FR-011 mandates single unified flow; n8n Webhook node supports multiple trigger paths via `event` field |
| Driver assignment logic | App-only (n8n only notifies) | FR-015 explicitly requires this separation |
| WhatsApp retry strategy | n8n retries 3x → fallback to in-app notification | Matches FR-016; n8n's built-in error handling with retry |

## Phase 1: Design & Contracts

### Data Model

See `specs/008-ai-chat-enhancement/data-model.md` for full entity definitions.

### Interface Contracts

See `specs/008-ai-chat-enhancement/contracts/` for:
- `n8n-trigger-events.md` — Shape of app→n8n webhook payloads (payment-confirmed, driver-assigned, delivery-completed)
- `n8n-webhook-responses.md` — Shape of n8n→app callback responses (confirmed handlers for each event type)
- `stripe-metadata-schema.md` — Required metadata fields in Stripe Checkout session for booking/phone data

### Quickstart

See `specs/008-ai-chat-enhancement/quickstart.md` for setup steps: Twilio Sandbox joining, Stripe webhook forwarding updates, n8n workflow import steps.
