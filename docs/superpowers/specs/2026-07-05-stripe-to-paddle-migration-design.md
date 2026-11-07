# Stripe → Paddle Migration + Project Audit Design

> **Date:** 2026-07-05
> **Status:** Approved
> **Scope:** Complete Stripe elimination, Paddle split payments, full project audit

---

## 1. Current State Analysis

### Payment Provider Status

Paddle is already the **primary payment provider**. The migration from Stripe was started but left incomplete:

| Component | Status | Notes |
|-----------|--------|-------|
| Paddle API client | ✅ Working | `lib/paddle/server.ts` |
| Paddle checkout overlay | ✅ Working | `step-payment.tsx` |
| Paddle webhook handler | ✅ Working | Handles `transaction.completed` |
| Paddle transaction creation | ✅ Working | `create-intent/route.ts` |
| Stripe refund API | ⚠️ Legacy | Still imports `stripe` SDK dynamically |
| Admin UI labels | ⚠️ Legacy | Shows "Stripe Gateway", "Stripe Balance" |
| Settings config keys | ⚠️ Legacy | `stripeFeePercent`, `stripeFeeFixed` |
| i18n variable names | ⚠️ Legacy | `stripeIntegration`, `stripeBalance` |

### Stripe References Inventory

**Functional code (must be refactored):**
- `app/api/admin/payments/refund/route.ts` — dynamic `stripe` SDK import for refunds
- `app/api/admin/payments/route.ts` — `stripeBalance` KPI calculation
- `app/admin/payments/page.tsx` — "Stripe Gateway", "Stripe Balance", "Stripe Fees" UI
- `app/admin/grid/page.tsx` — `stripeBalance` KPI display
- `app/admin/settings/page.tsx` — "Stripe Fee %", "Stripe Fee Fixed", Stripe Connect card
- `lib/config.ts` — `stripeFeePercent`, `stripeFeeFixed` config keys
- `lib/i18n/locales/en.ts` — `stripeIntegration`, `stripeDashboard`, `stripeBalance`
- `lib/i18n/locales/es.ts` — same remapped variables
- `lib/services/whatsapp-service.ts` — comments referencing Stripe webhook

**Database:**
- `lib/db/migrations/026_stripe_webhook_dedup.sql` — old Stripe index (can be cleaned)
- `lib/db/migrations/029_paddle_payments.sql` — already migrates to Paddle columns

**Documentation/Plans (informational, low priority):**
- `AGENTS.md`, `ANALYSIS_INDEX.md`, `RESERVATIONS_ANALYSIS.md`
- `specs/004-stripe-payment-gateway/plan.md`
- `plans/003-fix-payments-driver-payout-division.md`
- `plans/007-test-payment-webhooks.md`
- `plans/008-test-admin-api-routes.md`
- `plans/014-add-booking-confirmation-page.md`
- `docs/superpowers/specs/2026-06-21-parametrizable-config-design.md`
- `docs/superpowers/plans/2026-06-21-parametrizable-config-plan.md`
- `specs/010-whatsapp-n8n-communication/spec.md`
- `.specify/memory/constitution.md`

---

## 2. Phase 1: Stripe Elimination

### 2.1 Refund API Refactor

**File:** `app/api/admin/payments/refund/route.ts`

**Current behavior:** Dynamically imports `stripe` SDK, processes refunds via Stripe if `STRIPE_SECRET_KEY` exists and `stripe_payment_intent_id` is present. Falls back to manual refund.

**New behavior:**
- Remove all Stripe SDK imports and logic
- Implement Paddle-based refund: use Paddle API to create refunds
- If Paddle transaction ID exists, attempt Paddle refund
- Always support manual refund as fallback
- Update response format to include Paddle refund details

### 2.2 KPI Renaming

**Files:** `app/api/admin/payments/route.ts`, `app/admin/payments/page.tsx`, `app/admin/grid/page.tsx`

**Changes:**
- `stripeBalance` → `platformBalance` (API response + all UI references)
- `stripeBalance` label → "Platform Balance" (English) / "Saldo de Plataforma" (Spanish)
- Update TypeScript interfaces to match

### 2.3 Settings Config Keys

**File:** `app/admin/settings/page.tsx`, `lib/config.ts`

**Changes:**
- `stripe_fee_percent` → `platform_fee_percent`
- `stripe_fee_fixed` → `platform_fee_fixed`
- Labels: "Stripe Fee %" → "Platform Fee %", "Stripe Fee Fixed" → "Platform Fee Fixed"
- Replace Stripe Connect card with Paddle connection status card
- Update config key constants in `lib/config.ts`

### 2.4 i18n Variable Renaming

**Files:** `lib/i18n/locales/en.ts`, `lib/i18n/locales/es.ts`

**Changes:**
- `stripeIntegration` → `paddleIntegration` (values already say "Paddle")
- `stripeDashboard` → `paddleDashboard` (values already say "Paddle")
- `stripeBalance` → `platformBalance`
- Update all references in admin components

### 2.5 WhatsApp Service Comments

**File:** `lib/services/whatsapp-service.ts`

**Changes:** Update comments from "Stripe webhook" to "Paddle webhook"

### 2.6 Documentation Cleanup

Update references in:
- `AGENTS.md` — change Stripe plan reference to Paddle
- `ANALYSIS_INDEX.md` — update payment system reference
- `RESERVATIONS_ANALYSIS.md` — remove Stripe reference

---

## 3. Phase 2: Paddle Split Payments

### 3.1 Payment Split Model

When a booking payment is completed via Paddle:

1. **Platform commission:** Configurable percentage (from `platform_fee_percent` setting)
2. **Hotel share:** `totalAmount - platformCommission`

**Example:** $200 booking, 10% platform fee:
- Platform commission: $20
- Hotel payout: $180

### 3.2 Database Schema Changes

Add columns to `payments` table:
```sql
ALTER TABLE payments ADD COLUMN platform_fee_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN hotel_payout_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN split_status TEXT DEFAULT 'pending';
-- split_status: 'pending' | 'completed' | 'failed'
```

### 3.3 Webhook Enhancement

**File:** `app/api/webhooks/paddle/route.ts`

On `transaction.completed`:
1. Look up `platform_fee_percent` from config
2. Calculate `platformFee = totalAmount * (platformFeePercent / 100)`
3. Calculate `hotelPayout = totalAmount - platformFee`
4. Store split details in payment record
5. Update `split_status` to `completed`

### 3.4 Split Payment Reporting

Add admin API endpoint:
- `GET /api/admin/payments/splits` — Returns split payment breakdown
- Shows platform revenue vs hotel payouts by period

### 3.5 Refund Handling

Update refund flow:
- If refunding a split payment, reverse the split
- Platform fee is refunded from platform balance
- Hotel payout is deducted from hotel balance
- Update `split_status` to `refunded`

---

## 4. Phase 3: Project Audit

Full codebase audit covering:

### 4.1 Functional Bugs
- Navigation errors between screens
- Form validation failures
- State management issues
- API error handling gaps

### 4.2 Code Quality
- Dead code and unused imports
- Duplicate code across modules
- Unused dependencies in package.json
- Code that violates Clean Architecture

### 4.3 Performance
- Memory leaks (unclosed intervals, event listeners)
- Unnecessary re-renders
- Missing loading states
- Large bundle sizes

### 4.4 Security
- Missing input validation
- Unhandled exceptions
- Secret exposure risks
- CSRF/XSS vulnerabilities

### 4.5 UX/Accessibility
- Missing ARIA labels
- Keyboard navigation issues
- Responsive design gaps
- Inconsistent styling

---

## 5. Phase 4: Booking Module Review

### 5.1 Flow Verification

Verify complete 5-step booking wizard:
1. **Flight Logistics:** Flight number validation, arrival date/time
2. **Traveler Profile:** Name, email, phone with country selector
3. **Destination:** Address input, map integration
4. **Packages:** Package selection, return trip add-on
5. **Payment:** Paddle checkout overlay, status polling

### 5.2 Critical Checks
- Form validation on each step
- Back/forward navigation preserves state
- Calendar date constraints (15-day rule)
- Payment error handling and retry
- Booking confirmation display
- Mobile responsive layout
- Loading and empty states

---

## 6. Phase 5: Admin Panel Review

### 6.1 Page-by-Page Audit

All 23 admin pages:
- `agenda/`, `analytics/`, `cases/`, `customers/`, `dispatch/`, `drivers/`, `employees/`, `fleet/`, `grid/`, `hotels/`, `ia-chat/`, `intelligence/`, `inventory/`, `logistics/`, `orders/`, `payments/`, `promotions/`, `reservations/`, `roles/`, `settings/`, `support/`, `team/`

### 6.2 Critical Checks
- RBAC permission enforcement
- Realtime updates working
- CRUD operations functional
- Filters and search working
- Table sorting and pagination
- Form validation
- Error boundaries
- Empty states

---

## 7. Phase 6: Architecture Validation

### 7.1 Playbook Compliance

Verify:
- Feature-First directory structure
- Screaming Architecture (business intent visible)
- Clean Architecture layer isolation
- MVVM pattern in UI components
- Riverpod for state management
- go_router for navigation
- Business logic decoupled from UI

### 7.2 Layer Dependencies

Ensure:
- `lib/` has no imports from `app/`
- `app/components/` has no direct DB access
- API routes use service layer, not direct DB queries
- No circular dependencies between modules

---

## 8. Deliverables

1. ✅ Audit report with all findings
2. ✅ List of Stripe files removed/refactored
3. ✅ List of Paddle files created/modified
4. ✅ Paddle Sandbox configuration
5. ✅ Booking bugs fixed
6. ✅ Admin bugs fixed
7. ✅ Architecture improvements
8. ✅ Additional recommendations

---

## 9. Success Criteria

- Zero references to Stripe in functional code
- Paddle split payments working in Sandbox mode
- All booking flow steps functional
- All admin pages functional
- Architecture compliant with Playbook
- All tests passing
