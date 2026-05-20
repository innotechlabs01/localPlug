# Implementation Plan: Booking Data Persistence & UI Polish

**Branch**: `001-professional-landing-page` | **Date**: 2026-05-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-booking-persistence-mock/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Polish the existing 4-step booking form with a mock persistence layer (localStorage
queue with retry), toast notification system for error/success feedback, and responsive
UI refinements. All data persists locally on each step so users never lose progress,
even on page refresh or network failure.

## Technical Context

**Language/Version**: TypeScript 6 with strict mode

**Primary Dependencies**: Next.js 16 (App Router), Tailwind CSS v3, React 19

**Storage**: Browser localStorage (mock persistence layer with async API wrapper);
real API at `/api/booking` logs submissions but is non-persistent backend

**Testing**: Vitest + React Testing Library (component tests for toast system,
persistence queue, and booking form behavior)

**Target Platform**: Modern web browsers (Chrome, Safari, Firefox, Edge — last 2
major versions)

**Project Type**: Web application — frontend-only booking form (Next.js static
generation + client-side interactivity)

**Performance Goals**: Lighthouse 90+ on Performance, Accessibility, Best Practices;
form renders without layout shifts at 3 breakpoints (390px / 768px / 1280px+)

**Constraints**: 
- 44px minimum touch targets on all interactive elements
- Emerald glow focus indicators (2px offset) on inputs and buttons
- Toast auto-dismiss: 5s for success/info, manual dismiss required for errors
- Max 3 retry attempts for queued submissions
- Local storage quota management (fallback gracefully when full)

**Scale/Scope**: Single booking form with 4 steps, ~6 new files, existing form
structure reused

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Next.js & React Best Practices | ✅ PASS | Booking form uses `'use client'` only for interactive components; `page.tsx` is a server component with metadata export |
| II. SEO-First Development | ✅ PASS | `/booking` page has `metadata` export with title and description |
| III. Performance & Core Web Vitals | ✅ PASS | No heavy assets; form is statically generated with client-side hydration; toast library is lightweight |
| IV. Design System Compliance | ✅ PASS | Uses existing design tokens (Slate Navy, Mountain Emerald, Golden Sol); follows 8px spacing, 8px corner radii, same typography scale |
| V. TypeScript Strictness & Code Quality | ✅ PASS | All new code in TypeScript strict mode; no `any` types; ESLint + Prettier configured |
| VI. Accessibility (WCAG) | ✅ PASS | Visible focus rings, semantic HTML, 44px touch targets, ARIA labels on toast notifications |
| VII. Testing & Validation | ✅ PASS | Vitest component tests for persistence queue, toast system, step validation, and form restoration |

**Gate verdict**: ✅ ALL PRINCIPLES PASS — no violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-booking-persistence-mock/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── booking/
│   └── page.tsx              # Booking page (server component, unchanged)
├── api/
│   └── booking/
│       └── route.ts          # POST handler (unchanged)
└── components/
    └── booking/
        ├── booking-form.tsx      # MAIN — integrate persistence + toast + error boundaries
        ├── booking-confirmation.tsx  # (unchanged)
        ├── step-flight-logistics.tsx  # (unchanged)
        ├── step-traveler-profile.tsx   # (unchanged)
        ├── step-destination.tsx        # (unchanged)
        ├── step-packages.tsx           # (unchanged)
        ├── step-progress.tsx           # (unchanged)
        ├── lib/
        │   ├── persistence.ts     # NEW — mock localStorage persistence layer
        │   └── toast.tsx          # NEW — toast context and component
        └── __tests__/
            ├── persistence.test.ts    # NEW
            ├── toast.test.tsx         # NEW
            └── booking-form.test.tsx  # NEW
```

**Structure Decision**: Add a `lib/` subdirectory under `booking/` for the persistence
layer and toast system. Keep all step components unchanged except `booking-form.tsx`,
which orchestrates the new concerns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — all constitution principles pass. Complexity Tracking is empty.
