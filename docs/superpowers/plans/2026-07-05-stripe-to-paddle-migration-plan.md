# Stripe → Paddle Migration + Project Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Stripe elimination, implement Paddle split payments, and audit/fix the entire project.

**Architecture:** Refactor existing Paddle integration to support split payments (platform commission + hotel share). Remove all Stripe references from code, config, UI, and i18n. Audit booking and admin modules for bugs.

**Tech Stack:** Next.js 15, TypeScript, Paddle API (@paddle/paddle-js, @paddle/paddle-node-sdk), Turso/libSQL, React, Tailwind CSS, Vitest

---

## File Structure

### Files to Modify

| File | Responsibility |
|------|---------------|
| `app/api/admin/payments/refund/route.ts` | Refund API — remove Stripe, add Paddle refund |
| `app/api/admin/payments/route.ts` | Payments KPI API — rename stripeBalance → platformBalance |
| `app/admin/payments/page.tsx` | Admin payments UI — update labels |
| `app/admin/grid/page.tsx` | Admin dashboard — update stripeBalance KPI |
| `app/admin/settings/page.tsx` | Settings — rename Stripe fee keys, replace Stripe Connect card |
| `lib/config.ts` | Config keys — rename stripeFee → platformFee |
| `lib/i18n/locales/en.ts` | EN locale — rename stripe variables |
| `lib/i18n/locales/es.ts` | ES locale — rename stripe variables |
| `lib/services/whatsapp-service.ts` | Comments — update Stripe references |
| `app/api/webhooks/paddle/route.ts` | Webhook — add split payment logic |
| `app/components/booking/step-payment.tsx` | Payment step — no changes needed (already Paddle) |
| `lib/paddle/server.ts` | Paddle API — add refund function |

### Files to Create

| File | Responsibility |
|------|---------------|
| `lib/db/migrations/030_split_payment_columns.sql` | Add split payment columns to payments table |
| `app/api/admin/payments/splits/route.ts` | Split payment reporting API |
| `tests/app/api/webhooks/paddle/route.test.ts` | Paddle webhook tests |

---

## Task 1: Database Migration for Split Payments

**Files:**
- Create: `lib/db/migrations/030_split_payment_columns.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Migration 030: Add split payment columns to payments table
-- Supports platform commission + hotel payout split model

-- Add split payment columns
ALTER TABLE payments ADD COLUMN platform_fee_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN hotel_payout_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN split_status TEXT DEFAULT 'pending';
-- split_status values: 'pending' | 'completed' | 'failed' | 'refunded'

-- Create index for split payment queries
CREATE INDEX IF NOT EXISTS idx_payments_split_status ON payments(split_status);

-- Backfill existing completed payments with split data
-- Platform fee = 10% of amount (default commission rate)
UPDATE payments 
SET platform_fee_cents = CAST(amount * 0.10 AS INTEGER),
    hotel_payout_cents = amount - CAST(amount * 0.10 AS INTEGER),
    split_status = 'completed'
WHERE status = 'completed' AND split_status = 'pending';
```

- [ ] **Step 2: Commit migration**

```bash
git add lib/db/migrations/030_split_payment_columns.sql
git commit -m "feat: add split payment columns to payments table"
```

---

## Task 2: Paddle Server — Add Refund Function

**Files:**
- Modify: `lib/paddle/server.ts`

- [ ] **Step 1: Add refund function to Paddle server**

Add the following function after the `formatPaddleAmount` function at line 89:

```typescript
export async function createPaddleRefund(params: {
  transactionId: string
  amount?: number // Optional: partial refund amount in cents. If omitted, full refund
  reason?: string
}) {
  const { apiKey, baseUrl } = getClient()

  const body: Record<string, unknown> = {
    transaction_id: params.transactionId,
  }

  if (params.amount) {
    body.amount = formatPaddleAmount(params.amount)
  }

  if (params.reason) {
    body.reason = params.reason
  }

  const res = await fetch(`${baseUrl}/transactions/${params.transactionId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Paddle refund error (${res.status}): ${text}`)
  }

  const json = await res.json()
  return json.data as { id: string; status: string }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/paddle/server.ts
git commit -m "feat: add Paddle refund function to server API"
```

---

## Task 3: Config Keys — Rename Stripe to Platform

**Files:**
- Modify: `lib/config.ts`

- [ ] **Step 1: Find and rename config keys**

In `lib/config.ts`, find the config key constants and rename:

```typescript
// BEFORE (find these lines):
STRIPE_FEE_PCT: 'stripe_fee_percent',
STRIPE_FEE_FIXED: 'stripe_fee_fixed',

// AFTER (replace with):
PLATFORM_FEE_PCT: 'platform_fee_percent',
PLATFORM_FEE_FIXED: 'platform_fee_fixed',
```

Also rename the getter functions:

```typescript
// BEFORE:
export async function getStripeFeePercent(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.STRIPE_FEE_PCT)) || 0.029
}

export async function getStripeFeeFixed(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.STRIPE_FEE_FIXED)) || 0.30
}

// AFTER:
export async function getPlatformFeePercent(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.PLATFORM_FEE_PCT)) || 0.10
}

export async function getPlatformFeeFixed(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.PLATFORM_FEE_FIXED)) || 0.30
}
```

Also update the `getConfig()` function that returns config to the API:

```typescript
// Find where stripeFeePercent/stripeFeeFixed are returned and rename:
platformFeePercent: Number(getValue(cfg, KEYS.PLATFORM_FEE_PCT)) || 0.10,
platformFeeFixed: Number(getValue(cfg, KEYS.PLATFORM_FEE_FIXED)) || 0.30,
```

- [ ] **Step 2: Find all imports of getStripeFeePercent/getStripeFeeFixed and update**

Search for imports: `grep -r "getStripeFee" --include="*.ts" --include="*.tsx"`

Update any files that import these functions to use the new names.

- [ ] **Step 3: Commit**

```bash
git add lib/config.ts
git commit -m "refactor: rename stripe fee config keys to platform fee"
```

---

## Task 4: Refund API — Remove Stripe, Add Paddle

**Files:**
- Modify: `app/api/admin/payments/refund/route.ts`

- [ ] **Step 1: Rewrite refund API to use Paddle**

Replace the entire file content with:

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'
import { createPaddleRefund } from '@/lib/paddle/server'

export async function POST(req: Request) {
  try {
    const authError = await requirePermission('payments', 'update')
    if (authError) return authError

    const body = await req.json()
    const { booking_reference, reason } = body

    if (!booking_reference) {
      return NextResponse.json({ error: 'booking_reference required' }, { status: 400 })
    }

    const db = getDb()

    // Get the payment record
    const paymentResult = await db.execute({
      sql: 'SELECT * FROM payments WHERE booking_reference = ? AND status = ?',
      args: [booking_reference, 'completed']
    })

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found or not eligible for refund' }, { status: 404 })
    }

    const payment = paymentResult.rows[0]
    const paddleTransactionId = payment.paddle_transaction_id as string | null

    // If we have a Paddle transaction, process refund via Paddle
    if (paddleTransactionId) {
      try {
        const refund = await createPaddleRefund({
          transactionId: paddleTransactionId,
          reason: reason || 'Admin refund',
        })

        // Update payment status
        await db.execute({
          sql: `UPDATE payments SET status = 'refunded', refund_id = ?, refund_reason = ?, updated_at = datetime('now') WHERE booking_reference = ?`,
          args: [refund.id, reason || 'Admin refund', booking_reference]
        })

        // Update order payment status
        await db.execute({
          sql: `UPDATE orders SET payment_status = 'refunded', updated_at = datetime('now') WHERE booking_reference = ?`,
          args: [booking_reference]
        })

        // Update split status
        await db.execute({
          sql: `UPDATE payments SET split_status = 'refunded', updated_at = datetime('now') WHERE booking_reference = ?`,
          args: [booking_reference]
        })

        return NextResponse.json({
          success: true,
          refundId: refund.id,
          amount: payment.amount,
        })
      } catch (paddleError: unknown) {
        const message = paddleError instanceof Error ? paddleError.message : 'Unknown error'
        console.error('[Refund API] Paddle error:', message)
        return NextResponse.json({
          error: `Paddle refund failed: ${message}`
        }, { status: 500 })
      }
    }

    // Fallback: manual refund without Paddle
    await db.execute({
      sql: `UPDATE payments SET status = 'refunded', refund_reason = ?, updated_at = datetime('now') WHERE booking_reference = ?`,
      args: [reason || 'Admin manual refund', booking_reference]
    })

    await db.execute({
      sql: `UPDATE orders SET payment_status = 'refunded', updated_at = datetime('now') WHERE booking_reference = ?`,
      args: [booking_reference]
    })

    await db.execute({
      sql: `UPDATE payments SET split_status = 'refunded', updated_at = datetime('now') WHERE booking_reference = ?`,
      args: [booking_reference]
    })

    return NextResponse.json({
      success: true,
      refundId: `manual-${Date.now()}`,
      amount: payment.amount,
      note: 'Manual refund processed (no Paddle transaction)',
    })
  } catch (error) {
    console.error('[Refund API] error:', error)
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/payments/refund/route.ts
git commit -m "refactor: replace Stripe refund with Paddle refund API"
```

---

## Task 5: Admin Payments API — Rename stripeBalance

**Files:**
- Modify: `app/api/admin/payments/route.ts`

- [ ] **Step 1: Rename stripeBalance to platformBalance**

In `app/api/admin/payments/route.ts`, find line 50:

```typescript
// BEFORE:
stripeBalance: totalRevenue - driverPayouts,

// AFTER:
platformBalance: totalRevenue - driverPayouts,
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/payments/route.ts
git commit -m "refactor: rename stripeBalance to platformBalance in payments API"
```

---

## Task 6: Admin Payments Page — Update UI Labels

**Files:**
- Modify: `app/admin/payments/page.tsx`

- [ ] **Step 1: Update PaymentsApiResponse interface**

Find the interface and rename:

```typescript
// BEFORE (line ~47):
stripeBalance: number

// AFTER:
platformBalance: number
```

- [ ] **Step 2: Update KPI card label**

Find the KPI card that says 'Stripe Balance' and rename:

```typescript
// BEFORE (line ~204):
{ label: 'Stripe Balance', value: formatCurrency(kpi.stripeBalance), sub: 'Available for payout', iconClass: 'purple' },

// AFTER:
{ label: 'Platform Balance', value: formatCurrency(kpi.platformBalance), sub: 'Available for payout', iconClass: 'purple' },
```

- [ ] **Step 3: Update kpi useMemo**

Find the kpi useMemo and rename:

```typescript
// BEFORE (line ~167-168):
const stripeBalance = apiKpis?.stripeBalance ?? totalNet - refunds
return { totalRev, totalFees, totalNet, completed, pending, refunds, successfulCount, failedCount, pendingCount, driverPayouts, stripeBalance }

// AFTER:
const platformBalance = apiKpis?.platformBalance ?? totalNet - refunds
return { totalRev, totalFees, totalNet, completed, pending, refunds, successfulCount, failedCount, pendingCount, driverPayouts, platformBalance }
```

- [ ] **Step 4: Update Stripe Gateway card**

Find the card with class `stripe-card` and `stripe-title`:

```typescript
// BEFORE (line ~293-294):
<div className="stripe-card">
  <div className="stripe-title">Stripe Gateway</div>
  <div className="stripe-balance">{formatCurrency(kpi.stripeBalance)}</div>

// AFTER:
<div className="stripe-card">
  <div className="stripe-title">Paddle Gateway</div>
  <div className="stripe-balance">{formatCurrency(kpi.platformBalance)}</div>
```

- [ ] **Step 5: Update stripeFee state**

Find the stripeFee state and rename:

```typescript
// BEFORE (line ~79):
const [stripeFee, setStripeFee] = useState({ percent: 0.029, fixed: 0.30 })

// AFTER:
const [platformFee, setPlatformFee] = useState({ percent: 0.10, fixed: 0.30 })
```

- [ ] **Step 6: Update stripeFee fetch**

Find the useEffect that fetches config:

```typescript
// BEFORE (line ~106-113):
useEffect(() => {
  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => setStripeFee({
      percent: cfg.stripeFeePercent ?? 0.029,
      fixed: cfg.stripeFeeFixed ?? 0.30,
    }))
    .catch(() => {})
}, [])

// AFTER:
useEffect(() => {
  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => setPlatformFee({
      percent: cfg.platformFeePercent ?? 0.10,
      fixed: cfg.platformFeeFixed ?? 0.30,
    }))
    .catch(() => {})
}, [])
```

- [ ] **Step 7: Update Processing fee rate display**

Find the line that displays the fee rate:

```typescript
// BEFORE (line ~300):
<div className="stripe-detail"><span className="label">Processing fee rate</span><span className="value">{(stripeFee.percent * 100).toFixed(1)}% + ${stripeFee.fixed.toFixed(2)}</span></div>

// AFTER:
<div className="stripe-detail"><span className="label">Processing fee rate</span><span className="value">{(platformFee.percent * 100).toFixed(1)}% + ${platformFee.fixed.toFixed(2)}</span></div>
```

- [ ] **Step 8: Update method display**

Find where `method: 'Stripe'` is set and change to `method: 'Paddle'`:

```typescript
// BEFORE (line ~128):
method: 'Stripe',

// AFTER:
method: 'Paddle',
```

- [ ] **Step 9: Update Stripe Fees label in Payment Summary**

Find the "Stripe Fees" label:

```typescript
// BEFORE (line ~315):
<span className="label">Stripe Fees</span>

// AFTER:
<span className="label">Platform Fees</span>
```

- [ ] **Step 10: Commit**

```bash
git add app/admin/payments/page.tsx
git commit -m "refactor: update admin payments UI from Stripe to Paddle labels"
```

---

## Task 7: Admin Grid Page — Rename stripeBalance

**Files:**
- Modify: `app/admin/grid/page.tsx`

- [ ] **Step 1: Update PaymentData interface**

Find the interface and rename:

```typescript
// BEFORE (line ~60):
stripeBalance: number

// AFTER:
platformBalance: number
```

- [ ] **Step 2: Update all references to stripeBalance**

Search for `stripeBalance` in the file and replace with `platformBalance`:

```bash
grep -n "stripeBalance" app/admin/grid/page.tsx
```

Replace all occurrences.

- [ ] **Step 3: Update KPI card label**

Find the KPI card that says 'Stripe Balance' and rename to 'Platform Balance'.

- [ ] **Step 4: Commit**

```bash
git add app/admin/grid/page.tsx
git commit -m "refactor: rename stripeBalance to platformBalance in admin grid"
```

---

## Task 8: Admin Settings Page — Replace Stripe with Paddle

**Files:**
- Modify: `app/admin/settings/page.tsx`

- [ ] **Step 1: Update Fees & Taxes section**

Find the Stripe fee fields:

```typescript
// BEFORE (line ~227-228):
{ key: 'stripe_fee_percent', label: 'Stripe Fee %', sub: 'Processing percentage', defaultVal: '0.029', prefix: '', suffix: '', step: '0.001' },
{ key: 'stripe_fee_fixed', label: 'Stripe Fee Fixed', sub: 'Per-transaction fixed fee', defaultVal: '0.30', prefix: '$', suffix: 'USD', step: '0.01' },

// AFTER:
{ key: 'platform_fee_percent', label: 'Platform Fee %', sub: 'Commission percentage (e.g. 0.10 = 10%)', defaultVal: '0.10', prefix: '', suffix: '', step: '0.01' },
{ key: 'platform_fee_fixed', label: 'Platform Fee Fixed', sub: 'Per-transaction fixed fee', defaultVal: '0.30', prefix: '$', suffix: 'USD', step: '0.01' },
```

- [ ] **Step 2: Update Payment Integration section**

Replace the Stripe Connect card with Paddle status:

```typescript
// BEFORE (line ~391-421):
<section className="settings-section" id="section-payments">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    <span className="settings-section-title">{d.paymentIntegration || 'Payment Integration'}</span>
    <span className="settings-section-desc">{d.stripeProcessing || 'Stripe payment processing'}</span>
  </div>
  <div className="settings-section-body">
    <div className="stripe-connect-card">
      <div className="stripe-status">
        <div className="stripe-status-dot" />
        <span className="stripe-status-text">{d.connected || 'Connected'}</span>
        <span style={{ fontSize: 12, color: 'var(--fg-secondary)', marginLeft: 4 }}>{d.viaStripe || 'via Stripe'}</span>
      </div>
      <div className="stripe-field">
        <label>{d.publishableKey || 'Publishable Key'}</label>
        <div className="value">pk_live_51H3h...</div>
      </div>
      <div className="stripe-field">
        <label>{d.secretKey || 'Secret Key'}</label>
        <div className="value">sk_live_••••••••••••••••••••••••</div>
      </div>
      <div className="stripe-field">
        <label>{d.webhookUrl || 'Webhook URL'}</label>
        <div className="value">https://api.localplug.com/stripe/webhook</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => showToast(d.reconnect || 'Reconnect Stripe')}>{d.reconnect || 'Reconnect'}</button>
        <button className="btn btn-danger btn-sm" onClick={() => showToast(d.disconnect || 'Disconnect Stripe')}>{d.disconnect || 'Disconnect'}</button>
      </div>
    </div>
  </div>
</section>

// AFTER:
<section className="settings-section" id="section-payments">
  <div className="settings-section-header">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    <span className="settings-section-title">{d.paymentIntegration || 'Payment Integration'}</span>
    <span className="settings-section-desc">{d.paddleProcessing || 'Paddle payment processing'}</span>
  </div>
  <div className="settings-section-body">
    <div className="stripe-connect-card">
      <div className="stripe-status">
        <div className="stripe-status-dot" />
        <span className="stripe-status-text">{d.connected || 'Connected'}</span>
        <span style={{ fontSize: 12, color: 'var(--fg-secondary)', marginLeft: 4 }}>{d.viaPaddle || 'via Paddle'}</span>
      </div>
      <div className="stripe-field">
        <label>{d.clientToken || 'Client Token'}</label>
        <div className="value">test_••••••••••••••••••••</div>
      </div>
      <div className="stripe-field">
        <label>{d.apiKey || 'API Key'}</label>
        <div className="value">••••••••••••••••••••••••</div>
      </div>
      <div className="stripe-field">
        <label>{d.webhookUrl || 'Webhook URL'}</label>
        <div className="value">https://api.localplug.com/api/webhooks/paddle</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => showToast(d.reconnect || 'Reconnect Paddle')}>{d.reconnect || 'Reconnect'}</button>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Update Business Rules timeout label**

Find the payment timeout label:

```typescript
// BEFORE (line ~297):
{ key: 'payment_intent_timeout_ms', label: 'Payment Timeout', sub: 'Stripe intent creation timeout', defaultVal: '60000', suffix: 'ms', step: '1000' },

// AFTER:
{ key: 'payment_intent_timeout_ms', label: 'Payment Timeout', sub: 'Payment creation timeout', defaultVal: '60000', suffix: 'ms', step: '1000' },
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "refactor: replace Stripe references with Paddle in admin settings"
```

---

## Task 9: i18n Locale Files — Rename Stripe Variables

**Files:**
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/es.ts`

- [ ] **Step 1: Update EN locale**

Find and rename in `lib/i18n/locales/en.ts`:

```typescript
// BEFORE (line ~543, 551, 561):
stripeIntegration: 'Paddle Integration',
stripeDashboard: 'Paddle Dashboard',
stripeBalance: 'Paddle Balance',

// AFTER:
paddleIntegration: 'Paddle Integration',
paddleDashboard: 'Paddle Dashboard',
platformBalance: 'Platform Balance',
```

- [ ] **Step 2: Update ES locale**

Find and rename in `lib/i18n/locales/es.ts`:

```typescript
// BEFORE (line ~542, 550, 560):
stripeIntegration: 'Integración Paddle',
stripeDashboard: 'Panel de Paddle',
stripeBalance: 'Saldo Paddle',

// AFTER:
paddleIntegration: 'Integración Paddle',
paddleDashboard: 'Panel de Paddle',
platformBalance: 'Saldo de Plataforma',
```

- [ ] **Step 3: Search for all usages of stripeIntegration, stripeDashboard, stripeBalance in components**

```bash
grep -r "stripeIntegration\|stripeDashboard\|stripeBalance" --include="*.tsx" --include="*.ts" app/
```

Update all references to use the new variable names.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/locales/en.ts lib/i18n/locales/es.ts
git commit -m "refactor: rename Stripe i18n variables to Paddle/platform"
```

---

## Task 10: WhatsApp Service — Update Comments

**Files:**
- Modify: `lib/services/whatsapp-service.ts`

- [ ] **Step 1: Update Stripe references in comments**

Find all comments mentioning Stripe and update:

```bash
grep -n "stripe\|Stripe" lib/services/whatsapp-service.ts
```

Replace "Stripe webhook" with "Paddle webhook" in comments.

- [ ] **Step 2: Commit**

```bash
git add lib/services/whatsapp-service.ts
git commit -m "docs: update Stripe references to Paddle in whatsapp service"
```

---

## Task 11: Documentation Cleanup

**Files:**
- Modify: `AGENTS.md`
- Modify: `ANALYSIS_INDEX.md`

- [ ] **Step 1: Update AGENTS.md**

Find the Stripe plan reference and update:

```markdown
<!-- BEFORE -->
For context about Stripe payment gateway integration...

<!-- AFTER -->
For context about Paddle payment integration...
```

- [ ] **Step 2: Update ANALYSIS_INDEX.md**

Find the Stripe payment system reference and update.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md ANALYSIS_INDEX.md
git commit -m "docs: update Stripe references to Paddle in documentation"
```

---

## Task 12: Paddle Webhook — Add Split Payment Logic

**Files:**
- Modify: `app/api/webhooks/paddle/route.ts`

- [ ] **Step 1: Add split payment calculation to webhook**

Replace the entire file with:

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getConfigValue } from '@/lib/config'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const event = JSON.parse(rawBody)

    const eventType = event.event_type as string
    if (!eventType) {
      return NextResponse.json({ error: 'missing_event_type' }, { status: 400 })
    }

    if (eventType !== 'transaction.completed') {
      return NextResponse.json({ received: true })
    }

    const transactionId = event.data?.id as string | undefined
    const customData = event.data?.custom_data as Record<string, string> | undefined
    const bookingReference = customData?.booking_reference
    const totalAmount = event.data?.details?.totals?.total as number | undefined

    if (!transactionId || !bookingReference) {
      return NextResponse.json({ error: 'missing_data' }, { status: 400 })
    }

    const db = getDb()
    const now = new Date().toISOString()

    // Get platform fee percentage from config (default 10%)
    const platformFeePercent = await getConfigValue('platform_fee_percent') || '0.10'
    const feeRate = parseFloat(platformFeePercent)

    // Calculate split if we have the total amount
    let platformFeeCents = 0
    let hotelPayoutCents = 0
    let splitStatus = 'pending'

    if (totalAmount && totalAmount > 0) {
      platformFeeCents = Math.round(totalAmount * feeRate)
      hotelPayoutCents = totalAmount - platformFeeCents
      splitStatus = 'completed'
    }

    // Update payment with split details
    await db.execute({
      sql: `UPDATE payments SET 
        status = 'completed', 
        paddle_webhook_event_id = ?, 
        platform_fee_cents = ?,
        hotel_payout_cents = ?,
        split_status = ?,
        updated_at = ? 
      WHERE booking_reference = ? AND status = 'pending'`,
      args: [
        event.event_id || transactionId,
        platformFeeCents,
        hotelPayoutCents,
        splitStatus,
        now,
        bookingReference
      ],
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[Paddle Webhook]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/webhooks/paddle/route.ts
git commit -m "feat: add split payment calculation to Paddle webhook"
```

---

## Task 13: Split Payment Reporting API

**Files:**
- Create: `app/api/admin/payments/splits/route.ts`

- [ ] **Step 1: Create split payment reporting endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  const authError = await requirePermission('payments', 'view')
  if (authError) return authError

  const db = getDb()

  // Get split payment summary
  const result = await db.execute(`
    SELECT 
      COUNT(*) as total_payments,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'completed' THEN platform_fee_cents ELSE 0 END) as total_platform_fees,
      SUM(CASE WHEN status = 'completed' THEN hotel_payout_cents ELSE 0 END) as total_hotel_payouts,
      SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as total_refunds,
      COUNT(CASE WHEN split_status = 'completed' THEN 1 END) as split_completed,
      COUNT(CASE WHEN split_status = 'pending' THEN 1 END) as split_pending,
      COUNT(CASE WHEN split_status = 'failed' THEN 1 END) as split_failed
    FROM payments
  `)

  const row = result.rows[0]

  // Get recent split transactions
  const recentResult = await db.execute(`
    SELECT 
      booking_reference,
      package_name,
      amount,
      platform_fee_cents,
      hotel_payout_cents,
      split_status,
      status,
      created_at
    FROM payments 
    WHERE split_status != 'pending'
    ORDER BY created_at DESC 
    LIMIT 20
  `)

  return NextResponse.json({
    summary: {
      totalPayments: Number(row.total_payments),
      totalRevenue: Number(row.total_revenue) / 100,
      totalPlatformFees: Number(row.total_platform_fees) / 100,
      totalHotelPayouts: Number(row.total_hotel_payouts) / 100,
      totalRefunds: Number(row.total_refunds) / 100,
      splitCompleted: Number(row.split_completed),
      splitPending: Number(row.split_pending),
      splitFailed: Number(row.split_failed),
    },
    recentTransactions: recentResult.rows.map(r => ({
      bookingReference: r.booking_reference,
      packageName: r.package_name,
      amount: Number(r.amount) / 100,
      platformFee: Number(r.platform_fee_cents) / 100,
      hotelPayout: Number(r.hotel_payout_cents) / 100,
      splitStatus: r.split_status,
      status: r.status,
      createdAt: r.created_at,
    })),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/payments/splits/route.ts
git commit -m "feat: add split payment reporting API endpoint"
```

---

## Task 14: Booking Module Audit

**Files:**
- Review: `app/components/booking/` (all files)

- [ ] **Step 1: Test booking flow manually**

Navigate through the 5-step wizard:
1. Enter flight data → verify validation
2. Enter traveler profile → verify phone input
3. Enter destination → verify address
4. Select package → verify pricing
5. Complete payment → verify Paddle checkout

- [ ] **Step 2: Check error handling**

Test with:
- Invalid flight number
- Missing required fields
- Payment failure
- Network error during payment

- [ ] **Step 3: Check responsive design**

Test on mobile viewport (375px) and tablet (768px).

- [ ] **Step 4: Fix any issues found**

Document and fix any bugs discovered.

- [ ] **Step 5: Commit fixes**

```bash
git add app/components/booking/
git commit -m "fix: booking module audit fixes"
```

---

## Task 15: Admin Panel Audit

**Files:**
- Review: `app/admin/` (all pages)

- [ ] **Step 1: Test each admin page**

Verify:
- Dashboard loads with correct KPIs
- Payments page shows Paddle data
- Settings page saves correctly
- All CRUD operations work
- Filters and search function

- [ ] **Step 2: Check RBAC**

Test with different user roles (admin, manager, operator).

- [ ] **Step 3: Fix any issues found**

Document and fix any bugs discovered.

- [ ] **Step 4: Commit fixes**

```bash
git add app/admin/
git commit -m "fix: admin panel audit fixes"
```

---

## Task 16: Architecture Validation

**Files:**
- Review: `lib/`, `app/`

- [ ] **Step 1: Check layer dependencies**

Verify:
- `lib/` has no imports from `app/`
- `app/components/` has no direct DB access
- API routes use service layer

```bash
# Check for violations
grep -r "from '@/app'" lib/
grep -r "from '@/lib/db'" app/components/
```

- [ ] **Step 2: Check Clean Architecture**

Verify business logic is decoupled from UI.

- [ ] **Step 3: Fix any violations**

Document and fix any architecture issues.

- [ ] **Step 4: Commit fixes**

```bash
git add lib/ app/
git commit -m "refactor: architecture validation fixes"
```

---

## Task 17: Run Tests

- [ ] **Step 1: Run existing tests**

```bash
pnpm test
```

- [ ] **Step 2: Fix any failing tests**

- [ ] **Step 3: Add tests for Paddle webhook if missing**

```bash
# Create test file if it doesn't exist
touch tests/app/api/webhooks/paddle/route.test.ts
```

- [ ] **Step 4: Run tests again to verify**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test: add Paddle webhook tests and fix failing tests"
```

---

## Task 18: Final Verification

- [ ] **Step 1: Search for any remaining Stripe references**

```bash
grep -ri "stripe" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ lib/
```

Should return zero results (excluding docs/plans).

- [ ] **Step 2: Verify Paddle integration works**

Test a complete booking flow with Paddle payment in Sandbox mode.

- [ ] **Step 3: Verify admin panel shows Paddle data**

Check payments page, settings page, and dashboard.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Stripe to Paddle migration"
```

---

## Execution Notes

1. **Order of operations:** Tasks 1-11 (Stripe cleanup) should be done first. Tasks 12-13 (split payments) can be done in parallel. Tasks 14-18 (audit) should be done last.

2. **Testing:** After each task, verify the change doesn't break existing functionality. Run `pnpm test` periodically.

3. **Database:** Task 1 creates a migration. Run it against the database before testing split payments.

4. **Paddle Sandbox:** Ensure `PADDLE_ENVIRONMENT=sandbox` is set in `.env.local` for testing.

5. **Backup:** Before starting, create a git branch for this work:
   ```bash
   git checkout -b feat/stripe-to-paddle-migration
   ```
