# Research: AI Chat Enhancement + WhatsApp Business Workflow

## Scope

Research findings for the unified n8n workflow encompassing AI chat responses, WhatsApp payment notifications, driver assignment notifications, and delivery completion notifications. All findings consolidated from Phase 0 exploration.

## Architecture Decision Records

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WhatsApp provider | Twilio (WhatsApp Business Cloud API) | n8n has built-in Twilio node, no app dependencies, proven reliability |
| Twilio credential location | n8n instance only | Keeps app .env clean; n8n manages Twilio auth centrally |
| Stripe webhook routing | App → n8n (keep existing) | App already verifies signatures and stores payments; adding phone to payload is minimal change |
| Event emission pattern | Direct n8n webhook call | No event bus infrastructure; n8n client already exists and is simple |
| Phone number storage | `payments.customer_phone` column | Cleanest approach — phone comes via booking metadata → Stripe → webhook; already have the payment record |
| WhatsApp message type | Pre-approved utility templates via Twilio Content API | Required by Meta for business-initiated messages; utility category is free within 24h window |
| Single n8n workflow | One workflow with multiple webhook triggers | FR-011 mandates single unified flow |
| Driver assignment logic | App-only (n8n only notifies) | FR-015 explicitly requires this separation |
| WhatsApp retry strategy | n8n retries 3x → fallback to in-app notification | Matches FR-016; n8n's built-in error handling |

## n8n Twilio WhatsApp Node

**Availability**: Built-in node — no additional npm packages needed in the app.

**Auth Methods**:
- Auth Token: Account SID + Auth Token (dev only)
- API Key: Account SID + API Key SID + Secret (production)

**WhatsApp Operation**:
- Action node → "Send SMS/MMS/WhatsApp message"
- `To`: `whatsapp:+1234567890`
- `From`: Twilio WhatsApp-enabled number `whatsapp:+1XXXXXXXXXX`

## WhatsApp Setup (Development Sandbox)

1. Access: Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Join sandbox: send `join <sandbox-code>` to sandbox number via WhatsApp
3. Shared number: `whatsapp:+14155238886`
4. Limitation: only sandbox-joined numbers can communicate
5. Sandbox expires after 72h; must rejoin

### Production Setup Steps
1. Create/verify WhatsApp Business Account (WABA) via Meta Business Manager
2. Register phone number as WhatsApp Business sender in Twilio
3. Complete Meta business verification (1-3 business days)
4. Purchase dedicated Twilio number with WhatsApp capability

## Message Templates (Meta Requirement)

**Rule**: Business-initiated messages require pre-approved templates.

**Three Utility Templates Required**:

| Template Name | Variables | Category |
|---|---|---|
| `payment_confirmed` | `{{1}}` = customer name, `{{2}}` = booking ref, `{{3}}` = amount | Utility |
| `driver_assigned` | `{{1}}` = driver name, `{{2}}` = vehicle, `{{3}}` = ETA | Utility |
| `delivery_completed` | `{{1}}` = booking ref | Utility |

- Templates created in **Twilio Content Template Builder** or via Content API
- Each template needs EN + ES language variants
- Approval: minutes to 24 hours
- Utility templates within 24h window are **free** (no Meta conversation charge)
- Sandbox does not strictly enforce templates

## Stripe → n8n Integration

### Current Architecture
```
Stripe webhook (payment_intent.succeeded)
  → app/api/payments/webhook/route.ts (verifies signature, stores payment)
  → lib/n8n/client.ts:triggerPaymentConfirmation()
  → n8n webhook /webhook/payment-confirmed
```

### Changes Needed
1. Add `customer_phone` to Stripe Checkout metadata (booking flow side)
2. Extract `customerPhone` in webhook route from `intent.metadata`
3. Pass phone to `triggerPaymentConfirmation()` n8n call

### New Events (App → n8n)

| Event | n8n Webhook Path | Trigger Source |
|-------|-----------------|----------------|
| Payment confirmed | `payment-confirmed` | App Stripe webhook (existing) |
| Driver assigned | `driver-assigned` | New app API route |
| Delivery completed | `delivery-completed` | New app API route |

## Existing Codebase Patterns

### n8n Client (`lib/n8n/client.ts`)
- `sendN8nWebhook(event, data)` — generic POST to `${N8N_BASE_URL}/webhook/${event}`
- `triggerPaymentConfirmation(bookingData)` — calls `sendN8nWebhook('payment-confirmed', ...)`
- `triggerAiChatMessage(conversationData)` — calls `sendN8nWebhook('ai-chat-message', ...)`
- Pattern to follow for `triggerDriverAssigned()` and `triggerDeliveryCompleted()`

### Database (`payments` table)
- Columns: `booking_reference`, `package_id`, `package_name`, `amount`, `currency`, `status`, `stripe_payment_intent_id`, `stripe_webhook_event_id`, `customer_email`, `customer_name`, `error_message`, `created_at`, `updated_at`
- Missing: `customer_phone` — needs migration

### Existing Webhook Handler (`app/api/webhooks/n8n/route.ts`)
- Handles callbacks: `ai-chat-response`, `payment-confirmed`, `escalation-complete`, `fraud-alert`
- No handler for `driver-assigned` or `delivery-completed` callbacks yet

## WhatsApp Notification Sequence Flow

```
1. Customer completes Stripe Checkout
2. Stripe → app webhook (payment_intent.succeeded)
3. App stores payment (record.customerPhone = metadata.customerPhone)
4. App → n8n: POST /webhook/payment-confirmed {booking, customerPhone}
5. n8n Twilio node → WhatsApp: template "payment_confirmed"
   -- wait for driver assignment (separate event) --
6. App admin/staff assigns driver via dashboard
7. App → n8n: POST /webhook/driver-assigned {booking, driverName, vehicle, eta, customerPhone}
8. n8n Twilio node → WhatsApp: template "driver_assigned"
   -- wait for delivery completion --
9. Delivery marked complete in app
10. App → n8n: POST /webhook/delivery-completed {bookingRef, customerPhone}
11. n8n Twilio node → WhatsApp: template "delivery_completed"
```

## Twilio Dependencies in App

**Result**: Zero — no `twilio` package in `package.json`, no Twilio code anywhere. All WhatsApp sending happens in n8n. The app only needs to forward data via webhook payloads.

## Key Constraints

- WhatsApp templates must be created and approved before business-initiated messages work
- Customer phone number must be collected in the booking flow and passed to Stripe Checkout metadata
- The `orders` table referenced by `conversations.order_id` FK does not exist via migrations — out of scope for this feature
- All Twilio credentials live in n8n, never in app .env
