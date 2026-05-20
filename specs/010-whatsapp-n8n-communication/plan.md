# Implementation Plan: WhatsApp n8n Communication

**Branch**: `010-whatsapp-n8n-communication` | **Date**: 2026-05-19 | **Spec**: `specs/010-whatsapp-n8n-communication/spec.md`

**Input**: Feature specification from `specs/010-whatsapp-n8n-communication/spec.md`

## Summary

Implement bidirectional WhatsApp communication for the booking platform using Evolution API as the WhatsApp bridge, n8n for workflow automation, and OpenAI GPT-4o as the AI agent. The feature enables: (1) automatic post-payment WhatsApp confirmation, (2) AI-powered responses to incoming WhatsApp messages, (3) admin takeover with manual response capability, (4) automatic escalation detection, and (5) full visibility in the admin IA Chat Center. The system uses Evolution API (Baileys multi-device) deployed on EasyPanel, n8n workflows for event routing, and Turso for conversation/message persistence.

## Technical Context

**Language/Version**: Next.js 16+ with App Router, TypeScript strict mode

**Primary Dependencies**: `@libsql/client` (Turso driver), `stripe` (server SDK), `@stripe/stripe-js` (client SDK), existing i18n React Context

**Storage**: Turso (libSQL) — existing `payments` table has `customer_phone` column; existing `conversations` table has `whatsapp_instance` and `whatsapp_message_id` columns; new `whatsapp_events` table created via migration 009

**Testing**: `pnpm build` (TS check), manual verification via Evolution API webhook triggers and n8n workflow logs

**Target Platform**: Vercel (Next.js SSR + API routes), Evolution API on EasyPanel, n8n instance at `https://agent-ia.innotechlabssas.lat`

**Project Type**: Web application (Next.js App Router) + n8n workflow automation + Evolution API WhatsApp bridge

**Performance Goals**: WhatsApp trigger-to-notify latency <30s; AI response latency <5s; admin takeover <2s

**Constraints**:
- Evolution API (Baileys) — no pre-approved templates needed for 24h window responses
- WhatsApp Business Cloud API via Evolution API — all credentials stored in n8n and EasyPanel, NOT in app .env (except fallback direct send)
- n8n handles all WhatsApp sending; app only stores events and provides data
- Anti-baneo: max 50 msg/hour initially, ramp up over 2-3 weeks
- Phone numbers MUST be E.164 format (+573001234567)
- Webhook auth: Header Auth (Bearer token) with API keys in environment variables
- WhatsApp events retained 30 days, summaries preserved indefinitely

**Scale/Scope**: Single WhatsApp instance (`localplug-main`), 3 n8n workflows, 1 Evolution API webhook endpoint in app

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status |
|------|--------|
| I. Next.js & React Best Practices | ✅ PASS — WhatsApp triggers are server-side API routes; Evolution API webhook is a POST handler; no RSC violations |
| II. SEO-First Development | ✅ PASS — No new public pages; all changes are API routes and admin UI |
| III. Performance & Core Web Vitals | ✅ PASS — All new work is server-side/background; no client impact on landing pages |
| IV. Design System Compliance | ✅ PASS — Admin UI changes follow existing design tokens |
| V. TypeScript Strictness & Code Quality | ✅ PASS — Must maintain `strict: true`, no `any`; all new code typed |
| VI. Accessibility (WCAG) | ✅ PASS — Admin dashboard changes follow existing accessibility patterns |
| VII. Testing & Validation | ⚠️ FLAG — Must add API route validation for new Evolution API webhook endpoint |
| VIII. Admin Dashboard & Customer Support | ✅ PASS — WhatsApp integration directly enhances customer support; admin takeover improves response quality |
| IX. Real-Time Communication | ✅ PASS — WhatsApp is an async channel complementing existing web chat widget |

**Gate Decision**: PASS with flag — testing required for new API routes.

## Project Structure

### Documentation (this feature)

```text
specs/010-whatsapp-n8n-communication/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── evolution-webhook.md
│   ├── n8n-events.md
│   └── admin-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
lib/
├── n8n/
│   └── client.ts            # +sendWhatsAppDirect(), +sendWhatsAppButtons(), updated payloads

app/
├── api/
│   ├── webhooks/
│   │   ├── evolution/
│   │   │   └── route.ts     # NEW: Evolution API webhook handler (messages.upsert, receipts, status)
│   │   └── n8n/
│   │       └── route.ts     # UPDATED: +whatsapp-escalation, +whatsapp-ai-response, +whatsapp-sent handlers
│   ├── payments/
│   │   └── webhook/
│   │       └── route.ts     # UPDATED: passes customerPhone to n8n trigger
│   └── chat/
│       └── send/
│           └── route.ts     # UPDATED: agent messages sent via Evolution API for WhatsApp conversations

lib/db/migrations/
└── 009_whatsapp_events.sql  # NEW: whatsapp_events table + conversations columns

app/admin/ia-chat/
└── page.tsx                 # UPDATED: WhatsApp badge, channel filter, Take Over/AI Mode buttons

app/components/booking/lib/
├── payment-store.ts         # UPDATED: reads/writes customer_phone
├── stripe-server.ts         # UPDATED: includes customerPhone in webhook record
└── types.ts                 # UPDATED: PaymentRecord.customerPhone
```

**Structure Decision**: Existing Next.js App Router structure maintained. New files are minimal: 1 new API route (evolution webhook), 1 new migration, and updates to existing files. No structural changes needed.

## Complexity Tracking

No violations — all work follows existing patterns (extending n8n client, adding DB migrations, creating API routes).
