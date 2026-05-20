# Implementation Plan: Fix Global i18n Coverage

**Branch**: `006-fix-i18n-global` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-fix-i18n-global/spec.md`

## Summary

The i18n system currently creates isolated `<I18nProvider>` instances per component (8 on the landing page alone), so toggling language only affects the section where the toggle is located. The fix requires: (1) lifting the provider to the root layout so all components share a single language state, (2) adding localStorage persistence, (3) wiring up components that have translation keys but don't use them, and (4) adding missing translation keys for hardcoded strings across error pages, booking flow, and admin placeholder pages.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18+, Next.js 14+ (App Router)

**Primary Dependencies**: Next.js 14+ App Router, React Context (existing custom i18n system), Tailwind CSS v3+

**Storage**: Browser localStorage for language preference persistence

**Testing**: Vitest + React Testing Library (component), Playwright (E2E)

**Target Platform**: Web (responsive: mobile 390px, tablet 768px, desktop 1280px)

**Project Type**: Next.js web application (landing page + booking flow + admin dashboard)

**Performance Goals**: Language switching must feel instant (<100ms perceived), no layout shift on toggle

**Constraints**: Custom i18n system retained (no third-party library migration), two languages only (en/es), existing translation key structure preserved

**Scale/Scope**: ~30 components need i18n wiring, ~50 new translation keys needed, 8 landing sections + 5 booking steps + 9 admin pages + 3 system pages (error/404/loading)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js & React Best Practices | ✅ PASS | Provider lifting to root layout aligns with RSC patterns. Client components only where interactivity needed. |
| II. SEO-First Development | ✅ PASS | Dynamic `<html lang>` attribute improves SEO. Metadata can be updated via `generateMetadata`. |
| III. Performance & Core Web Vitals | ✅ PASS | No additional JS bundles. Language toggle is lightweight state change. |
| IV. Design System Compliance | ✅ PASS | No UI changes — only text content updates. |
| V. TypeScript Strictness | ✅ PASS | All new code will use strict TypeScript with explicit types. |
| VI. Accessibility (WCAG) | ✅ PASS | Dynamic `lang` attribute improves screen reader support. |
| VII. Testing & Validation | ✅ PASS | E2E tests for language toggle propagation. Component tests for provider behavior. |

**Gate Result**: PASS — no violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/006-fix-i18n-global/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI contracts)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                          # MODIFY: Add root I18nProvider wrapper
├── page.tsx                            # No changes (already renders sections)
├── error.tsx                           # MODIFY: Add i18n with direct translation import
├── not-found.tsx                       # MODIFY: Add i18n with direct translation import
├── loading.tsx                         # MODIFY: Add i18n with direct translation import
├── booking/
│   └── page.tsx                        # No changes (inherits provider from layout)
├── admin/
│   ├── layout.tsx                      # MODIFY: Import useI18n, use t.admin.nav.* for sidebar
│   ├── page.tsx                        # No changes (inherits provider)
│   ├── ia-chat/page.tsx                # MODIFY: Import useI18n, use t.admin.placeholders.*
│   ├── intelligence/page.tsx           # MODIFY: Import useI18n, use t.admin.placeholders.*
│   ├── logistics/page.tsx              # MODIFY: Import useI18n, use t.admin.placeholders.*
│   ├── grid/page.tsx                   # MODIFY: Import useI18n, use t.admin.placeholders.*
│   └── dispatch/page.tsx               # MODIFY: Import useI18n, use t.admin.placeholders.*
├── components/
│   ├── layout/
│   │   ├── header.tsx                  # MODIFY: Remove per-component I18nProvider wrapper
│   │   └── footer.tsx                  # MODIFY: Remove per-component I18nProvider wrapper
│   ├── hero/
│   │   ├── hero-section.tsx            # MODIFY: Remove per-component I18nProvider wrapper
│   │   └── hero-cta.tsx                # No changes (inherits from parent)
│   ├── concierge/concierge-section.tsx # MODIFY: Remove per-component I18nProvider wrapper
│   ├── how-it-works/how-it-works-section.tsx  # MODIFY: Remove per-component I18nProvider wrapper
│   ├── about/about-section.tsx         # MODIFY: Remove per-component I18nProvider wrapper
│   ├── testimonials/testimonials-section.tsx   # MODIFY: Remove per-component I18nProvider wrapper
│   ├── cta/cta-section.tsx             # MODIFY: Remove per-component I18nProvider wrapper
│   ├── booking/
│   │   ├── booking-form.tsx            # MODIFY: Remove per-component I18nProvider (inherits from layout)
│   │   ├── step-progress.tsx           # MODIFY: Add useI18n, use new translation keys
│   │   ├── booking-confirmation.tsx    # MODIFY: Add useI18n, use new translation keys
│   │   ├── payment-form.tsx            # MODIFY: Add useI18n, use new translation keys
│   │   └── lib/error-boundary.tsx      # MODIFY: Add i18n with direct translation import
│   └── ui/
│       └── lang-toggle.tsx             # No changes (already uses useI18n)
└── lib/i18n/
    ├── index.tsx                       # MODIFY: Add localStorage persistence, html lang sync
    └── locales/
        ├── en.ts                       # MODIFY: Add missing translation keys
        └── es.ts                       # MODIFY: Add missing translation keys
```

**Structure Decision**: Existing Next.js App Router structure retained. No new files or directories needed — all changes are modifications to existing files. The root `app/layout.tsx` becomes the single I18nProvider host.

## Complexity Tracking

> No Constitution Check violations — no complexity tracking needed.
