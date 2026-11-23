# Plan 014: Add Booking Confirmation Page (Post-Payment Funnel)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md` — unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5fa9c22..HEAD -- app/booking/ app/api/booking/ middleware.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `5fa9c22`, 2026-06-11

## Why this matters

The booking flow takes the user through flight info → traveler profile → destination → packages → Stripe payment — and then ends. There's no confirmation page showing their booking reference, itinerary summary, or next steps. The WhatsApp message (sent by the webhook) is helpful, but the web funnel is incomplete. Every tourism platform needs a confirmation page to give users confidence their booking was received.

## Current state

- Booking flow: single page at `app/booking/page.tsx` with step wizard
- After Stripe payment: Stripe redirects back to the site (URL via `return_url` in payment intent), but there's no dedicated confirmation page
- `app/booking/` directory has only `page.tsx` — no subdirectories
- Booking data (reference number, itinerary) is returned by `POST /api/booking` but not shown to user
- i18n has `booking.confirmation` section with title, subtitle, nextSteps, referenceLabel, whatsappInfo keys — these exist but aren't displayed anywhere

**Existing i18n keys** (in `lib/i18n/locales/en.ts` lines 337-345):
```ts
confirmation: {
  title: 'Booking Confirmed!',
  subtitle: 'We will contact you via WhatsApp.',
  stressFree: 'Stress-Free Landing',
  stressFreeDesc: 'From the runway to your rooftop...',
  nextSteps: 'Next steps:',
  bookAnother: 'Book Another Arrival',
  referenceLabel: 'Booking Reference',
  whatsappInfo: 'We will reach out to you via WhatsApp shortly...',
},
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:
- Create `app/booking/confirmation/page.tsx` — static confirmation page with booking reference
- Update `app/api/payments/confirm/route.ts` (or the Stripe webhook) to redirect or return the confirmation URL
- Update `app/api/booking/route.ts` to return booking reference in a way the confirmation page can display

**Out of scope**:
- A full "manage my booking" flow (login, cancellations, modifications)
- Driver tracking or real-time status updates on the confirmation page
- Email confirmation (beyond the WhatsApp message)

## Git workflow

- Branch: `feat/014-booking-confirmation-page`
- Commit per step; message: `feat: add booking confirmation page with itinerary summary`
- Do NOT push or open a PR

## Steps

### Step 1: Create the confirmation page

Create `app/booking/confirmation/page.tsx`:
```tsx
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function ConfirmationPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const reference = searchParams.get('ref') || ''

  return (
    <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-bg-card rounded-2xl p-8 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-display font-bold text-white">
          {t.booking.confirmation.title}
        </h1>
        <p className="text-white/60">
          {t.booking.confirmation.subtitle}
        </p>

        {reference && (
          <div className="bg-bg-dark rounded-xl p-4 space-y-2">
            <p className="text-sm text-white/40 uppercase tracking-wider">
              {t.booking.confirmation.referenceLabel}
            </p>
            <p className="text-xl font-mono font-bold text-accent">
              {reference}
            </p>
          </div>
        )}

        <p className="text-white/60 text-sm">
          {t.booking.confirmation.whatsappInfo}
        </p>

        <div className="pt-4 space-y-3">
          <p className="text-sm font-semibold text-white/80">
            {t.booking.confirmation.nextSteps}
          </p>
          <ul className="text-sm text-white/60 text-left space-y-2">
            <li>✓ {t.booking.confirmation.stressFree}</li>
            <li>→ {t.booking.confirmation.stressFreeDesc}</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block w-full py-3 px-6 bg-accent text-white rounded-xl
                     font-semibold hover:bg-accent/90 transition-colors"
        >
          {t.booking.confirmation.bookAnother}
        </Link>
      </div>
    </main>
  )
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 2: Wire Stripe return_url to confirmation page

In the Stripe payment intent creation (`app/api/payments/create-intent/route.ts`), update the `return_url` to point to the confirmation page with the booking reference:
```ts
return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/confirmation?ref=${bookingRef}`,
```

Search for the existing `return_url` in the create-intent route and modify it.

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 3: Expose confirmation page in middleware

If `middleware.ts` protects the `/booking` route, ensure `/booking/confirmation` is accessible. Check `isPublicRoute`:

```ts
const isPublicRoute = createRouteMatcher([
  '/',
  '/booking',
  '/booking/confirmation',
  // ... existing routes
])
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0

### Step 4: Build verification

Run full build to ensure the new page compiles:
```bash
pnpm build
```

**Verify**: exit 0, no errors

## Test plan

- Run `pnpm test` — all existing tests pass.
- Manual: complete a Stripe test payment → verify redirect to `/booking/confirmation?ref=ORD-XXXX`
- Manual: navigate to `/booking/confirmation?ref=TEST-123` directly → page renders correctly

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `app/booking/confirmation/page.tsx` exists and renders booking reference from query params
- [ ] Stripe `return_url` includes `ref=<bookingReference>`
- [ ] `/booking/confirmation` is in the public routes middleware matcher
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report back if:
- The payment intent creation route doesn't have a `return_url` — check the Stripe PaymentIntent.create call.
- The booking reference (`bookingRef`) isn't available in the create-intent route — check the request body and flow.
- A verification fails twice.

## Maintenance notes

- The confirmation page uses the existing i18n keys in `booking.confirmation`. If more detail is needed (itinerary, driver info), add it here.
- Future enhancement: add a real-time status section (driver assignment, estimated pickup time) by polling the bookings API.
- The page currently uses a static design. If it needs to be SSR (SEO for sharing), convert to a server component that fetches booking data.
