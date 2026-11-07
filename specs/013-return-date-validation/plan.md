# Implementation Plan: Return Date Validation

**Branch**: `013-return-date-validation` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-return-date-validation/spec.md`

## Summary

Add client-side date validation in the booking flight logistics step: when the user checks "return transportation", the return date picker's minimum date becomes the arrival date (instead of the generic 10-day-ahead rule). If arrival date changes past an already-set return date, the return date is cleared.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16 (App Router)

**Primary Dependencies**: React client component (`'use client'`) — no new dependencies

**Storage**: N/A (client-side validation only; arrival/return dates already persisted)

**Testing**: Vitest + React Testing Library (component-level tests for validation behavior)

**Target Platform**: Web (Vercel deployment, modern browsers with `<input type="date">`)

**Project Type**: Web application (Next.js)

**Performance Goals**: Validation must respond instantly on user interaction — no async/network calls

**Constraints**: Client-side validation only; must coexist with existing flight validation (n8n-powered flight number check) and 10-day advance notice rule

**Scale/Scope**: Single file change in `app/components/booking/step-flight-logistics.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Next.js & React Best Practices | PASS | Uses existing `'use client'` component; no new server component needed |
| II. SEO-First Development | PASS | N/A — form validation step, no page-level impact |
| III. Performance & Core Web Vitals | PASS | Zero-impact — synchronous DOM attribute change |
| IV. Design System Compliance | PASS | No visual changes; reuses existing date input styling |
| V. TypeScript Strictness & Code Quality | PASS | Will use explicit types for state and handlers |
| VI. Accessibility (WCAG) | PASS | Native `<input type="date">` with label; `min` attribute is accessible |
| VII. Testing & Validation | PASS | Component test for min-date binding and edge cases |
| VIII. Admin Dashboard & Customer Support | N/A | — |
| IX. Real-Time Communication | N/A | — |

No violations. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/013-return-date-validation/
├── plan.md              # This file
├── research.md          # All unknowns resolved (trivial)
├── data-model.md        # FlightData entity (already defined)
├── quickstart.md        # Quick reference for the change
└── tasks.md             # /speckit.tasks output (not created here)
```

### Source Code (repository root)

```text
app/components/booking/
└── step-flight-logistics.tsx   # Single file change: return date min validation
```

**Structure Decision**: Single file modification in the existing booking form component hierarchy. No new files or directories needed.
