# UI Contracts: Fix Global i18n Coverage

**Feature**: 006-fix-i18n-global
**Date**: 2026-05-16

## Contract 1: I18nProvider Context Shape

The root `I18nProvider` must expose this context shape to all child components:

```typescript
interface I18nContextValue {
  lang: 'en' | 'es';
  t: typeof en;           // Full translation object
  setLang: (lang: 'en' | 'es') => void;
  toggleLang: () => void;
}
```

**Consumer contract**: Any component calling `useI18n()` receives this shape. No component should create its own provider.

---

## Contract 2: Translation Key Structure

All translation files (`en.ts`, `es.ts`) must export objects with this top-level structure:

```typescript
interface Translations {
  common: { back: string; continue: string; pay: string; processing: string; error: string; tryAgain: string; loading: string };
  nav: { home: string; booking: string; close: string; services: string; whyUs: string; testimonials: string; planMyArrival: string };
  hero: { title: string; subtitle: string; planNow: string; viewServices: string };
  concierge: { title: string; subtitle: string; items: ConciergeItem[] };
  howItWorks: { title: string; subtitle: string; steps: Step[] };
  about: { title: string; titleHighlight: string; subtitle: string; features: Feature[] };
  testimonials: { title: string; subtitle: string; items: Testimonial[] };
  cta: { title: string; subtitle: string; button: string };
  booking: { title: string; steps: BookingSteps; confirmation: BookingConfirmation };
  footer: { copyright: string; tagline: string; quickLinks: QuickLinks; contact: Contact; services: Services; safety: Safety; fleet: Fleet; terms: Terms; address: string };
  admin: { nav: AdminNav; dashboard: Dashboard; orders: Orders; team: Team; agenda: Agenda; placeholders: Placeholders };
  errors: { title: string; message: string; tryAgain: string };           // NEW
  notFound: { title: string; message: string; backHome: string };         // NEW
  loading: { text: string };                                               // NEW
  stepProgress: { labels: StepLabels; complete: string };                 // NEW
}
```

**Constraint**: Both `en.ts` and `es.ts` must conform to this identical shape. TypeScript enforces via `typeof en`.

---

## Contract 3: Language Persistence

**Storage key**: `localplug-lang`
**Values**: `'en'` | `'es'`
**Default**: `'en'` (when key is absent or unreadable)

**Write contract**: `toggleLang()` and `setLang()` must:
1. Update React state
2. Write to `localStorage` (wrapped in try/catch)
3. Update `document.documentElement.lang`

**Read contract**: Provider initialization must:
1. Check `typeof window !== 'undefined'` (SSR guard)
2. Read `localStorage.getItem('localplug-lang')`
3. Validate value is `'en'` or `'es'` (fallback to `'en'` if invalid)
4. Set as initial state

---

## Contract 4: Component i18n Usage

**Pattern for components with context access**:
```tsx
'use client';
import { useI18n } from '@/lib/i18n';

export function MyComponent() {
  const { t, lang } = useI18n();
  return <h1>{t.section.key}</h1>;
}
```

**Pattern for error boundaries (no context access)**:
```tsx
import { en } from '@/lib/i18n/locales/en';
import { es } from '@/lib/i18n/locales/es';

function getTranslations() {
  if (typeof window === 'undefined') return en;
  const lang = localStorage.getItem('localplug-lang');
  return lang === 'es' ? es : en;
}
```

---

## Contract 5: HTML lang Attribute

**Initial render**: `<html lang="en">` (static in `layout.tsx`)
**After hydration**: `document.documentElement.lang` synced with `I18nProvider` state via `useEffect`

**Timing**: The attribute updates after the first client-side render. During SSR, it remains `"en"` (matching the default state).

---

## Contract 6: Admin Sidebar Navigation

The admin sidebar must render labels from translation keys, not hardcoded strings:

```typescript
// Before (hardcoded):
const navItems = [
  { label: 'Concierge Elite', href: '/admin', icon: ... },
  { label: 'Order Queue', href: '/admin/orders', icon: ... },
];

// After (translated):
const { t } = useI18n();
const navItems = [
  { label: t.admin.nav.conciergeElite, href: '/admin', icon: ... },
  { label: t.admin.nav.orderQueue, href: '/admin/orders', icon: ... },
];
```
