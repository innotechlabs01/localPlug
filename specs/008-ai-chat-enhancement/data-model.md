# Data Model: AI Chat Enhancement + WhatsApp Business Workflow

## Entities

### Payment Record (`payments` table)

Represents a customer payment processed via Stripe. Extended to include phone number for WhatsApp notifications.

| Column | Type | Description |
|--------|------|-------------|
| `booking_reference` | TEXT (PK) | Unique booking reference |
| `package_id` | TEXT | Selected service package ID |
| `package_name` | TEXT | Human-readable package name |
| `amount` | REAL | Payment amount |
| `currency` | TEXT | Currency code (e.g., USD, COP) |
| `status` | TEXT | Payment status: `pending`, `completed`, `failed` |
| `stripe_payment_intent_id` | TEXT | Stripe PaymentIntent ID |
| `stripe_webhook_event_id` | TEXT | Stripe webhook event ID (dedup) |
| `customer_email` | TEXT | Customer email |
| `customer_name` | TEXT | Customer name |
| `customer_phone` | TEXT | Customer phone number with country code (e.g., +573001234567) — **NEW** |
| `error_message` | TEXT | Error details if payment failed |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

**State Transitions**: `pending` → `completed` | `failed`

### WhatsApp Notification (conceptual — lives in n8n, not in app DB)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Notification ID |
| `type` | ENUM | `payment_confirmed`, `driver_assigned`, `delivery_completed` |
| `recipient_phone` | TEXT | Customer WhatsApp number |
| `template_name` | TEXT | Twilio template name |
| `template_variables` | JSON | Variables interpolated into template |
| `status` | ENUM | `queued`, `sent`, `delivered`, `failed`, `retrying` |
| `retry_count` | INT | Attempt count (max 3) |
| `failure_reason` | TEXT | Error details if permanently failed |
| `fallback_notification_sent` | BOOLEAN | Whether in-app fallback was triggered |

### Stripe Checkout Metadata Schema

Metadata fields the app must pass when creating a Stripe Checkout Session:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bookingReference` | TEXT | Yes | Unique booking reference |
| `customerName` | TEXT | Yes | Customer full name |
| `customerEmail` | TEXT | Yes | Customer email |
| `customerPhone` | TEXT | No | Customer phone (needed for WhatsApp) |
| `packageName` | TEXT | Yes | Selected package name |
| `flightNumber` | TEXT | Yes | Arrival flight number |
| `airline` | TEXT | Yes | Airline name |
| `arrivalDate` | TEXT | Yes | Arrival date |
| `arrivalTime` | TEXT | Yes | Arrival time |

## Relationships

```
Payment Record 1───* WhatsApp Notification (via booking_reference — n8n side)
Payment Record 1───1 Conversation (via booking_reference)
Conversation    *───1 Support Agent (via assigned_agent_id)
```

## Validation Rules

| Field | Rule |
|-------|------|
| `customer_phone` | Format: `+<country_code><number>` (E.164), e.g., +573001234567 |
| `customer_phone` | Optional — if missing/null, WhatsApp notification is skipped (FR-017) |
| WhatsApp `status` | Max 3 retry attempts before marking permanently failed |
| WhatsApp `status` | On permanent failure, trigger in-app notification fallback |

## Migration

**File**: `lib/db/migrations/008_whatsapp_phone.sql`

```sql
ALTER TABLE payments ADD COLUMN customer_phone TEXT;
```
