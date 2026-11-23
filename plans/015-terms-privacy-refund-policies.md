# Legal Pages & Policy Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Terms of Service, Privacy Policy, and Refund/Cancelation Policy pages to the landing site, link them from the footer, and require explicit terms acceptance in the booking flow before payment.

**Architecture:** Three new static pages under `app/(public)/` with shared layout, i18n-driven content in `lib/i18n/locales/`, footer links wired to the new routes, and a terms acceptance checkbox in the payment step that gates the "Pay" button. All legal content is placeholder text that must be reviewed by a legal professional before production.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, existing i18n system (`lib/i18n`)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/(public)/terms/page.tsx` | Terms of Service page |
| Create | `app/(public)/privacy/page.tsx` | Privacy Policy page |
| Create | `app/(public)/refund-policy/page.tsx` | Refund & Cancelation Policy page |
| Create | `app/components/legal/legal-page.tsx` | Shared legal page layout component |
| Modify | `app/components/layout/footer.tsx` | Add links to legal pages |
| Modify | `lib/i18n/locales/es.ts` | Add `legal` section + footer links |
| Modify | `lib/i18n/locales/en.ts` | Add `legal` section + footer links |
| Modify | `app/components/booking/step-payment.tsx` | Add terms acceptance checkbox |

---

### Task 1: Shared Legal Page Layout Component

**Files:**
- Create: `app/components/legal/legal-page.tsx`

- [ ] **Step 1: Create the shared legal page component**

```tsx
'use client'

import { useI18n } from '@/lib/i18n'
import Header from '@/app/components/layout/header'
import Footer from '@/app/components/layout/footer'

interface LegalPageProps {
  titleKey: string
  lastUpdatedKey: string
  children: React.ReactNode
}

export default function LegalPage({ titleKey, lastUpdatedKey, children }: LegalPageProps) {
  const { t } = useI18n()
  const legalT = t.legal as Record<string, string>

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-20">
        <div className="mx-auto max-w-container px-4 md:px-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            {legalT[titleKey] || titleKey}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-10">
            {legalT[lastUpdatedKey] || lastUpdatedKey}
          </p>
          <div className="prose prose-invert max-w-none text-[var(--text-secondary)] text-[15px] leading-relaxed space-y-6">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `npx next build --filter=LegalPage 2>&1 | head -20` (or just TypeScript check)
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add app/components/legal/legal-page.tsx
git commit -m "feat(legal): add shared legal page layout component"
```

---

### Task 2: Terms of Service Page

**Files:**
- Create: `app/(public)/terms/page.tsx`

- [ ] **Step 1: Create Terms of Service page**

```tsx
import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service | Medellín Premium',
  description: 'Terms and conditions for using Medellín Premium travel services.',
}

const sections = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By accessing or using the services provided by Medellín Premium ("we", "us", "our"), including our website, booking platform, and concierge services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.',
  },
  {
    heading: '2. Services',
    body: 'Medellín Premium provides travel concierge services including airport transfers, city tours, experience packages, and VIP nightlife arrangements in Medellín, Colombia. Services are booked through our website and confirmed via WhatsApp communication.',
  },
  {
    heading: '3. Booking & Payment',
    body: 'All bookings require full payment at the time of reservation through our secure payment processor (Paddle). Prices are listed in USD. Local currency conversion (COP) is provided for reference using the current TRM exchange rate. A service fee and applicable taxes (IVA) are included in the final price.',
  },
  {
    heading: '4. Cancellation & Refund Policy',
    body: 'Free cancellation is available up to 48 hours before the scheduled arrival date. Cancellations within 48 hours of arrival are subject to a full charge. Refunds for services not rendered due to our fault will be processed in full. See our Refund Policy page for complete details.',
  },
  {
    heading: '5. User Responsibilities',
    body: 'You are responsible for providing accurate booking information including flight details, contact information, and destination address. Changes to flight information must be communicated promptly via WhatsApp. We are not responsible for missed pickups due to incorrect flight information provided by the user.',
  },
  {
    heading: '6. Limitation of Liability',
    body: 'Medellín Premium acts as a concierge service coordinating third-party transportation and experience providers. While we carefully select our partners, we are not liable for delays, cancellations, or issues caused by third-party providers. Our liability is limited to the total amount paid for the specific service in question.',
  },
  {
    heading: '7. Communications',
    body: 'By booking our services, you consent to receive communications via WhatsApp, email, and phone regarding your reservation. These include booking confirmations, pickup coordination, and post-service follow-ups. You may opt out of marketing communications at any time.',
  },
  {
    heading: '8. Governing Law',
    body: 'These Terms are governed by the laws of Colombia. Any disputes shall be resolved in the courts of Medellín, Antioquia, Colombia.',
  },
  {
    heading: '9. Changes to Terms',
    body: 'We reserve the right to modify these Terms at any time. Changes take effect upon posting to our website. Continued use of our services after changes constitutes acceptance of the modified Terms.',
  },
  {
    heading: '10. Contact',
    body: 'For questions about these Terms, contact us at hello@medellinwithoutstress.com.',
  },
]

export default function TermsPage() {
  return (
    <LegalPage titleKey="termsTitle" lastUpdatedKey="lastUpdated">
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-xl font-semibold text-white mb-3">{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </LegalPage>
  )
}
```

- [ ] **Step 2: Verify page compiles and renders**

Run: `npx next build 2>&1 | grep -i "terms\|error" | head -10`
Expected: Build succeeds, no errors

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/terms/page.tsx
git commit -m "feat(legal): add Terms of Service page"
```

---

### Task 3: Privacy Policy Page

**Files:**
- Create: `app/(public)/privacy/page.tsx`

- [ ] **Step 1: Create Privacy Policy page**

```tsx
import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Medellín Premium',
  description: 'How Medellín Premium collects, uses, and protects your personal data.',
}

const sections = [
  {
    heading: '1. Information We Collect',
    body: 'When you book a service, we collect: full name, email address, phone number (with country code), flight details (airline, flight number, arrival date/time), destination address, and payment information (processed securely by Paddle — we do not store card details). We also collect usage data such as pages visited and interaction patterns on our website.',
  },
  {
    heading: '2. How We Use Your Information',
    body: 'We use your information to: process and confirm your booking, coordinate airport pickup and services, communicate via WhatsApp and email regarding your reservation, process payments and refunds, improve our services and website experience, and send marketing communications (only with your consent).',
  },
  {
    heading: '3. WhatsApp Communications',
    body: 'Our service relies on WhatsApp for real-time coordination. When you provide your phone number, you consent to receiving service-related messages via WhatsApp. These include booking confirmations, pickup instructions, and post-service follow-ups. WhatsApp\'s own privacy policy governs data processed through their platform.',
  },
  {
    heading: '4. Data Sharing',
    body: 'We share your information only with: our transportation partners (pickup location, flight details, and contact info for coordination), our experience providers (name and group size for tours/activities), Paddle (payment processing — governed by their own privacy policy), and n8n automation workflows (for service coordination). We do not sell your personal data to third parties.',
  },
  {
    heading: '5. Data Security',
    body: 'We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), secure payment processing through Paddle (PCI DSS compliant), and access controls on internal systems. However, no method of transmission over the Internet is 100% secure.',
  },
  {
    heading: '6. Data Retention',
    body: 'We retain your booking information for 2 years after your last service date for customer support and service improvement purposes. Payment transaction records are retained as required by Colombian tax law. You may request deletion of your data by contacting us.',
  },
  {
    heading: '7. Your Rights',
    body: 'You have the right to: access your personal data, correct inaccurate data, request deletion of your data, opt out of marketing communications, and receive a copy of your data in a portable format. To exercise these rights, contact hello@medellinwithoutstress.com.',
  },
  {
    heading: '8. Cookies',
    body: 'Our website uses essential cookies for functionality (language preference, session state) and analytics cookies to understand usage patterns. You can manage cookie preferences through your browser settings.',
  },
  {
    heading: '9. Changes to This Policy',
    body: 'We may update this Privacy Policy periodically. Changes take effect upon posting. We will notify you of material changes via email or a prominent notice on our website.',
  },
  {
    heading: '10. Contact',
    body: 'For privacy-related inquiries, contact hello@medellinwithoutstress.com.',
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage titleKey="privacyTitle" lastUpdatedKey="lastUpdated">
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-xl font-semibold text-white mb-3">{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </LegalPage>
  )
}
```

- [ ] **Step 2: Verify page compiles**

Run: `npx next build 2>&1 | grep -i "privacy\|error" | head -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/privacy/page.tsx
git commit -m "feat(legal): add Privacy Policy page"
```

---

### Task 4: Refund & Cancelation Policy Page

**Files:**
- Create: `app/(public)/refund-policy/page.tsx`

- [ ] **Step 1: Create Refund & Cancelation Policy page**

```tsx
import type { Metadata } from 'next'
import LegalPage from '@/app/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Refund & Cancelation Policy | Medellín Premium',
  description: 'Our cancelation and refund terms for travel services in Medellín.',
}

const sections = [
  {
    heading: '1. Free Cancelation',
    body: 'You may cancel your booking free of charge up to 48 hours before your scheduled arrival date and time. To cancel, contact us via WhatsApp or email at hello@medellinwithoutstress.com with your booking reference.',
  },
  {
    heading: '2. Late Cancelation (Within 48 Hours)',
    body: 'Cancelations made within 48 hours of the scheduled arrival are subject to a full charge of the booked service. This is because our team and transportation partners are already dispatched and coordinated for your arrival.',
  },
  {
    heading: '3. No-Show',
    body: 'If you do not arrive at the scheduled time and do not contact us within 2 hours of your arrival time, the booking is considered a no-show and is non-refundable. We will attempt to contact you via WhatsApp and phone before marking a no-show.',
  },
  {
    heading: '4. Flight Changes or Delays',
    body: 'If your flight is significantly delayed or changed, notify us as soon as possible via WhatsApp. We will make reasonable efforts to adjust your pickup time. If we cannot accommodate the change, a full refund will be provided for the transportation portion.',
  },
  {
    heading: '5. Service Not Rendered',
    body: 'If we fail to provide the booked service (e.g., no pickup arrives, experience cancelled by us), you are entitled to a full refund of the amount paid for the affected service. Refunds are processed within 5-10 business days to the original payment method.',
  },
  {
    heading: '6. Partial Services',
    body: 'If a portion of your package was delivered and a portion was not, we will refund the pro-rated cost of the undelivered services. For example, if you booked a package with airport transfer + city tour and the tour was cancelled, you would be refunded the tour portion only.',
  },
  {
    heading: '7. How Refunds Are Processed',
    body: 'Refunds are processed through our payment provider (Paddle) to the original payment method. Processing time is 5-10 business days from the date of approval. You will receive confirmation via email when a refund is initiated.',
  },
  {
    heading: '8. Disputes',
    body: 'If you believe a refund was incorrectly denied, contact us at hello@medellinwithoutstress.com with your booking reference and a description of the issue. We will review your case within 3 business days.',
  },
  {
    heading: '9. Contact',
    body: 'For cancelation or refund requests, contact us via WhatsApp (preferred for fastest response) or email hello@medellinwithoutstress.com.',
  },
]

export default function RefundPolicyPage() {
  return (
    <LegalPage titleKey="refundTitle" lastUpdatedKey="lastUpdated">
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-xl font-semibold text-white mb-3">{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </LegalPage>
  )
}
```

- [ ] **Step 2: Verify page compiles**

Run: `npx next build 2>&1 | grep -i "refund\|error" | head -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/refund-policy/page.tsx
git commit -m "feat(legal): add Refund & Cancelation Policy page"
```

---

### Task 5: i18n Keys for Legal Pages

**Files:**
- Modify: `lib/i18n/locales/es.ts`
- Modify: `lib/i18n/locales/en.ts`

- [ ] **Step 1: Add `legal` section to Spanish locale**

In `lib/i18n/locales/es.ts`, add the `legal` section right before the `footer` section (around line 386):

```ts
  legal: {
    termsTitle: 'Términos de Servicio',
    privacyTitle: 'Política de Privacidad',
    refundTitle: 'Política de Reembolso y Cancelación',
    lastUpdated: 'Última actualización: Agosto 2026',
  },
  footer: {
```

- [ ] **Step 2: Add `legal` section to English locale**

In `lib/i18n/locales/en.ts`, add the `legal` section right before the `footer` section (around line 387):

```ts
  legal: {
    termsTitle: 'Terms of Service',
    privacyTitle: 'Privacy Policy',
    refundTitle: 'Refund & Cancelation Policy',
    lastUpdated: 'Last updated: August 2026',
  },
  footer: {
```

- [ ] **Step 3: Add footer link keys to both locales**

In the `footer` section of **es.ts**, add after the existing `terms` key:

```ts
    terms: 'Términos de Servicio',
    privacy: 'Política de Privacidad',
    refundPolicy: 'Política de Reembolso',
```

In the `footer` section of **en.ts**, add after the existing `terms` key:

```ts
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    refundPolicy: 'Refund Policy',
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/locales/es.ts lib/i18n/locales/en.ts
git commit -m "feat(i18n): add legal page translations (en/es)"
```

---

### Task 6: Footer Links to Legal Pages

**Files:**
- Modify: `app/components/layout/footer.tsx`

- [ ] **Step 1: Add legal links to the footer**

In `app/components/layout/footer.tsx`, add a new `<nav>` section inside the grid. Replace the Company section (lines 48-54) with an expanded version that includes legal links:

```tsx
          <nav aria-label="Company">
            <h4 className="text-sm font-semibold text-white mb-5">{t.footer.company}</h4>
            <ul className="space-y-3">
              <li><a href="#services" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200">{t.footer.aboutUs}</a></li>
              <li><a href="mailto:hello@medellinwithoutstress.com" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200">{t.footer.contactUs}</a></li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h4 className="text-sm font-semibold text-white mb-5">{t.footer.terms}</h4>
            <ul className="space-y-3">
              <li><a href="/terms" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200">{t.footer.terms}</a></li>
              <li><a href="/privacy" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200">{t.footer.privacy}</a></li>
              <li><a href="/refund-policy" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200">{t.footer.refundPolicy}</a></li>
            </ul>
          </nav>
```

This adds a 5th column to the footer grid. Update the grid class from `lg:grid-cols-4` to `lg:grid-cols-5` on line 11:

```tsx
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[60px] mb-[60px]">
```

- [ ] **Step 2: Verify footer renders correctly**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/components/layout/footer.tsx
git commit -m "feat(legal): add Terms, Privacy, and Refund Policy links to footer"
```

---

### Task 7: Terms Acceptance Checkbox in Booking Flow

**Files:**
- Modify: `app/components/booking/step-payment.tsx`
- Modify: `lib/i18n/locales/es.ts` (booking section)
- Modify: `lib/i18n/locales/en.ts` (booking section)

- [ ] **Step 1: Add i18n keys for the checkbox**

In `lib/i18n/locales/es.ts`, inside `booking.steps.payment`, add:

```ts
        acceptTerms: 'Acepto los',
        termsLink: 'Términos de Servicio',
        and: 'y la',
        privacyLink: 'Política de Privacidad',
        refundLinkLink: 'Política de Reembolso',
        mustAccept: 'Debes aceptar los términos para continuar',
```

In `lib/i18n/locales/en.ts`, inside `booking.steps.payment`, add:

```ts
        acceptTerms: 'I accept the',
        termsLink: 'Terms of Service',
        and: 'and',
        privacyLink: 'Privacy Policy',
        refundLinkLink: 'Refund Policy',
        mustAccept: 'You must accept the terms to continue',
```

- [ ] **Step 2: Add terms checkbox to step-payment.tsx**

In `app/components/booking/step-payment.tsx`, add state for terms acceptance after the existing `error` state (around line 61):

```tsx
  const [termsAccepted, setTermsAccepted] = useState(false)
```

Add the checkbox UI before the pay button (before line 234, after the error block):

```tsx
      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-card)] text-[var(--accent-gold)] focus:ring-[var(--accent-gold)] focus:ring-offset-0"
          />
          <span className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {paymentT.acceptTerms}{' '}
            <a href="/terms" target="_blank" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-light)]">{paymentT.termsLink}</a>{' '}
            {paymentT.and}{' '}
            <a href="/privacy" target="_blank" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-light)]">{paymentT.privacyLink}</a>{' '}
            {paymentT.and}{' '}
            <a href="/refund-policy" target="_blank" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-light)]">{paymentT.refundLinkLink}</a>
          </span>
        </label>
        {!termsAccepted && (
          <p className="text-[12px] text-[var(--text-muted)] mt-2 ml-7">{paymentT.mustAccept}</p>
        )}
      </div>
```

Modify the pay button to be disabled when terms are not accepted. Change the button (around line 236-241):

```tsx
      {phase === 'ready' && (
        <div>
          <button
            onClick={handlePay}
            disabled={!termsAccepted}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-light)] text-[var(--bg-dark)] text-label-md font-bold hover:from-[var(--accent-gold-light)] hover:to-[var(--accent-gold)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(212,165,116,0.25)] hover:shadow-[0_6px_20px_rgba(212,165,116,0.35)]"
          >
            {t.common.payAndConfirm}
          </button>
        </div>
      )}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add app/components/booking/step-payment.tsx lib/i18n/locales/es.ts lib/i18n/locales/en.ts
git commit -m "feat(legal): add terms acceptance checkbox to booking payment step"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Full build check**

Run: `npx next build 2>&1 | tail -20`
Expected: Build completes successfully with no errors

- [ ] **Step 2: Verify all routes exist**

Check that these URLs would work:
- `/terms` → Terms of Service
- `/privacy` → Privacy Policy
- `/refund-policy` → Refund & Cancelation Policy

- [ ] **Step 3: Verify footer links render**

Check that the footer shows: Terms of Service, Privacy Policy, Refund Policy in the Legal section.

- [ ] **Step 4: Verify booking checkbox blocks payment**

Check that the "Pay and Confirm" button is disabled until the terms checkbox is checked.

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "feat(legal): complete legal pages and policy acceptance flow"
```

---

## ⚠️ IMPORTANT: Legal Content Disclaimer

The policy text in Tasks 2, 3, and 4 is **placeholder content** written as a starting point. Before going to production:

1. **Have a lawyer review all three policies** — especially the Privacy Policy (Colombian data protection law / Ley 1581 de 2012)
2. **Verify refund terms match your actual business practices** — the 48-hour window, no-show policy, etc.
3. **Ensure Paddle's requirements are met** — payment processors often have specific ToS/Privacy requirements
4. **Check GDPR compliance** if you serve EU customers
5. **Update the "Last Updated" date** when policies are finalized

The checkbox in the booking flow creates a binding acceptance record, so the underlying policies MUST be legally sound before launch.
