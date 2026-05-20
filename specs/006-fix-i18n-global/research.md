# Research: Fix Global i18n Coverage

**Feature**: 006-fix-i18n-global
**Date**: 2026-05-16

## R1: Root Provider Architecture

**Decision**: Lift `<I18nProvider>` to `app/layout.tsx` (root layout) so all components share a single language state.

**Rationale**: The current architecture creates 8+ isolated providers on the landing page alone. Each has its own `useState('en')`, making language toggle work only within that section. A single root provider ensures all components — header, hero, footer, booking, admin — read from the same context.

**Alternatives considered**:
- *Prop drilling*: Rejected — would require passing `lang`/`t` through every component, breaking encapsulation.
- *URL-based language (e.g., /es/...)*: Rejected — adds routing complexity, breaks existing URL structure, out of scope for this fix.
- *Third-party library (next-intl, react-i18next)*: Rejected — existing custom system is sound; the issue is architectural (isolated providers), not library capability.

**Implementation**: The root layout is a Server Component. `I18nProvider` is a Client Component (`'use client'`). The provider wraps `{children}` inside the `<body>` tag. All landing page sections, booking form, and admin layout inherit the context automatically.

**Impact**: 8 component files need their `<I18nProvider>` wrapper removed. 1 file (`app/layout.tsx`) needs the provider added.

---

## R2: Language Persistence Strategy

**Decision**: Store language preference in `localStorage` with key `localplug-lang`. Read on provider initialization.

**Rationale**: localStorage survives page reloads and navigation within the same browser. It's the simplest persistence mechanism for client-side state.

**Alternatives considered**:
- *Cookie-based*: Rejected — cookies are sent with every HTTP request, adding overhead. Also requires server-side reading for SSR, adding complexity.
- *URL query param (?lang=es)*: Rejected — changes URL structure, not user-friendly, doesn't persist across navigation.
- *IndexedDB*: Rejected — overkill for a single string value.

**Implementation**:
1. On provider mount, read `localStorage.getItem('localplug-lang')` as initial state (fallback to `'en'`).
2. On language toggle, write `localStorage.setItem('localplug-lang', newLang)`.
3. Guard against SSR (localStorage not available on server) with `typeof window !== 'undefined'` check.

**Edge case**: If localStorage is disabled/unavailable, the provider silently falls back to in-memory state (session-only persistence). No error shown to user.

---

## R3: Dynamic HTML lang Attribute

**Decision**: Use a `useEffect` in `I18nProvider` to sync `document.documentElement.lang` with the current language state.

**Rationale**: The `<html lang>` attribute is critical for screen readers and SEO. It must update dynamically when the user switches language.

**Implementation**: A single `useEffect` watches `lang` and sets `document.documentElement.lang = lang`. This runs after hydration, so the initial server render uses the default `'en'` (which matches the static attribute in `layout.tsx`).

**Alternatives considered**:
- *Next.js `generateMetadata`*: Rejected — metadata is server-rendered and doesn't update on client-side language toggle.
- *Manual DOM manipulation in each component*: Rejected — DRY violation, error-prone.

---

## R4: Error Boundary i18n Approach

**Decision**: Error boundaries (`error.tsx`, `error-boundary.tsx`) will import translation objects directly (not via context) since they render when the provider tree is broken.

**Rationale**: `error.tsx` is a React error boundary — it renders when a child component throws. If the error occurs in the provider itself or above it, the context won't be available. Direct import of translation objects ensures error messages always display.

**Implementation**:
```tsx
import { en } from '@/lib/i18n/locales/en';
import { es } from '@/lib/i18n/locales/es';

function getErrorTranslations(lang: string) {
  return lang === 'es' ? es.errors : en.errors;
}
```

The language is read from `localStorage` directly (synchronous read) since error boundaries render outside the normal component tree.

**Alternatives considered**:
- *Wrap error boundary in its own provider*: Rejected — defeats the purpose; error boundary renders when provider fails.
- *Hardcode English only in error pages*: Rejected — violates the "all text must change" requirement.

---

## R5: Missing Translation Keys

**Decision**: Add the following new translation key sections to `en.ts` and `es.ts`:

| Section | Keys | Source Component |
|---------|------|------------------|
| `errors` | `title`, `message`, `tryAgain` | `error.tsx`, `error-boundary.tsx` |
| `notFound` | `title`, `message`, `backHome` | `not-found.tsx` |
| `loading` | `text` | `loading.tsx` |
| `stepProgress` | `labels.flight`, `labels.profile`, `labels.destination`, `labels.packages`, `complete` | `step-progress.tsx` |
| `booking.confirmation` | `nextSteps`, `bookAnother` (existing keys: title, subtitle, stressFree, stressFreeDesc) | `booking-confirmation.tsx` |
| `common` | `processingPayment`, `payAndConfirm` | `payment-form.tsx` |

**Rationale**: These strings are currently hardcoded in components. Adding them to the translation files enables full i18n coverage.

**Trip/experience names**: The `step-destination.tsx` component has hardcoded trip names (e.g., "Guatapé / El Peñol"). Per clarification, these need localized English variants. New keys under `booking.steps.destination.trips.*` will be added.

---

## R6: Booking Form Provider Removal

**Decision**: Remove `<I18nProvider>` from `booking-form.tsx` since it will inherit from the root layout provider.

**Rationale**: The root layout provider will wrap all routes. The booking page (`app/booking/page.tsx`) is a child of the root layout, so `BookingForm` and all its step components will automatically have access to the shared language context.

**Implementation**: In `booking-form.tsx`, remove the `<I18nProvider>` wrapper but keep `<ErrorBoundary>` and `<ToastProvider>`. The `BookingFormInner` component continues to use `useI18n()` — it now reads from the root context instead of a local one.

---

## R7: Admin Layout Sidebar Wiring

**Decision**: Convert the static `navItems` array in `app/admin/layout.tsx` to use `useI18n()` for labels.

**Rationale**: The sidebar labels are currently hardcoded English strings. Translation keys exist at `admin.nav.*` but are unused.

**Implementation**:
1. Make the admin layout a client component (or extract sidebar to a client component).
2. Import `useI18n` and destructure `t`.
3. Replace hardcoded labels with `t.admin.nav.conciergeElite`, `t.admin.nav.orderQueue`, etc.
4. The "Concierge Elite" and "Admin" text in the top bar also use translation keys.

**Note**: The admin layout is currently a Server Component. Converting it to a client component (or extracting the sidebar) is necessary for `useI18n()` to work. This is acceptable since the sidebar is interactive (navigation, collapse toggle).
