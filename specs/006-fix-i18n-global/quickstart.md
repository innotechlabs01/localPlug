# Quickstart: Fix Global i18n Coverage

**Feature**: 006-fix-i18n-global
**Date**: 2026-05-16

## What This Feature Does

Fixes the i18n (internationalization) system so that toggling the language switcher updates ALL text on every page, not just the header. The root cause is that each component creates its own isolated `<I18nProvider>`, so language state doesn't propagate.

## Key Changes

### 1. Root Provider (High Impact)

**File**: `app/layout.tsx`

Add `<I18nProvider>` around `{children}` in the root layout. This makes all components share a single language context.

### 2. Remove Per-Component Providers (8 files)

Remove `<I18nProvider>` wrapper from these components (they inherit from root):

- `app/components/layout/header.tsx`
- `app/components/layout/footer.tsx`
- `app/components/hero/hero-section.tsx`
- `app/components/concierge/concierge-section.tsx`
- `app/components/how-it-works/how-it-works-section.tsx`
- `app/components/about/about-section.tsx`
- `app/components/testimonials/testimonials-section.tsx`
- `app/components/cta/cta-section.tsx`
- `app/components/booking/booking-form.tsx`

### 3. Add localStorage Persistence

**File**: `lib/i18n/index.tsx`

- Read initial language from `localStorage.getItem('localplug-lang')` (fallback to `'en'`)
- Write to `localStorage.setItem('localplug-lang', newLang)` on toggle
- Guard with `typeof window !== 'undefined'` for SSR safety

### 4. Sync HTML lang Attribute

**File**: `lib/i18n/index.tsx`

Add `useEffect` to set `document.documentElement.lang = lang` when language changes.

### 5. Wire Up Components Without i18n

These components have hardcoded English text and need `useI18n()`:

| Component | File | Action |
|-----------|------|--------|
| Admin layout sidebar | `app/admin/layout.tsx` | Import useI18n, use `t.admin.nav.*` |
| Admin placeholder pages (5) | `app/admin/{ia-chat,intelligence,logistics,grid,dispatch}/page.tsx` | Import useI18n, use `t.admin.placeholders.*` |
| Step progress | `app/components/booking/step-progress.tsx` | Import useI18n, use new `stepProgress` keys |
| Booking confirmation | `app/components/booking/booking-confirmation.tsx` | Import useI18n, use `t.booking.confirmation.*` |
| Payment form | `app/components/booking/payment-form.tsx` | Import useI18n, use `t.common.*` |
| Error page | `app/error.tsx` | Direct import of translation objects |
| Not found page | `app/not-found.tsx` | Direct import of translation objects |
| Loading page | `app/loading.tsx` | Direct import of translation objects |
| Error boundary | `app/components/booking/lib/error-boundary.tsx` | Direct import of translation objects |

### 6. Add Missing Translation Keys

**Files**: `lib/i18n/locales/en.ts`, `lib/i18n/locales/es.ts`

Add these new sections:

```typescript
// New keys to add
errors: {
  title: string;
  message: string;
  tryAgain: string;
},
notFound: {
  title: string;
  message: string;
  backHome: string;
},
loading: {
  text: string;
},
stepProgress: {
  labels: {
    flight: string;
    profile: string;
    destination: string;
    packages: string;
  };
  complete: string;
},
// Extend existing booking.confirmation with:
// confirmation.nextSteps, confirmation.bookAnother
// Add common.processingPayment, common.payAndConfirm
// Add booking.steps.destination.trips.* for trip names
```

## How to Test

1. **Landing page toggle**: Load page → click language toggle → verify ALL sections update (header, hero, concierge, how-it-works, about, testimonials, CTA, footer)
2. **Persistence**: Toggle to Spanish → reload page → verify still Spanish
3. **Cross-page persistence**: Toggle to Spanish → navigate to /booking → verify Spanish → navigate to /admin → verify Spanish
4. **Admin sidebar**: Navigate to /admin → toggle language → verify sidebar labels update
5. **Placeholder pages**: Navigate to /admin/ia-chat → toggle language → verify "Coming Soon" text updates
6. **HTML lang**: Inspect `<html>` element → toggle language → verify `lang` attribute changes
7. **Error page**: Trigger error boundary → verify error text is in current language
8. **Booking form**: Fill partial form → toggle language → verify labels update but form data preserved

## Common Pitfalls

- **Forgetting SSR guard**: `localStorage` is not available on server. Always check `typeof window !== 'undefined'` before accessing.
- **Error boundaries**: `error.tsx` renders outside the provider tree. Use direct translation imports, not `useI18n()`.
- **Admin layout is Server Component**: Must extract sidebar to client component or convert layout to client component for `useI18n()` to work.
- **Translation key symmetry**: Both `en.ts` and `es.ts` must have identical keys. TypeScript enforces this via `typeof en`.
