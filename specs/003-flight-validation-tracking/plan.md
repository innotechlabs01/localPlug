# Implementation Plan: Flight Validation & User Tracking

**Branch**: `003-flight-validation-tracking` | **Date**: 2026-05-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-flight-validation-tracking/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add three capabilities to the existing booking wizard: (1) enforce a 15-day minimum
booking window on the arrival date picker (HTML5 `min` attribute + step-gate validation),
(2) validate airline + flight number against a mock flight reference data set (client-side
service with simulated latency, consistent with the existing persistence layer pattern),
and (3) expose a server-side `/api/bookings/search` endpoint that lets the concierge team
look up bookings by flight number + airline. All follow the existing mock/persistence
patterns established in spec 002.

## Technical Context

**Language/Version**: TypeScript 6 with strict mode

**Primary Dependencies**: Next.js 16 (App Router), Tailwind CSS v3, React 19,
Vitest + React Testing Library

**Storage**: Browser localStorage (existing booking drafts + submitted bookings);
server-side in-memory Map for concierge booking search endpoint (mock, resets on
server restart); internal mock flight reference data set (static array in source)

**Testing**: Vitest + React Testing Library (flight validation service, date
enforcement, concierge search endpoint)

**Target Platform**: Modern web browsers (Chrome, Safari, Firefox, Edge — last 2
major versions)

**Project Type**: Web application — frontend-only booking form with two new
API endpoints (flight validation + booking search)

**Performance Goals**: Flight validation mock completes within 300ms (simulated
latency matching persistence layer); Lighthouse 90+ maintained

**Constraints**:
- Flight validation MUST NOT block form advancement on validation failure
  (booking flagged instead)
- Date enforcement uses system/server timezone, not user local timezone
- Mock flight reference data covers at least 10 major airlines with 3+ flights each
- `__mock_fail` toggle (existing pattern) reused for flight validation failure
  simulation
- 15-day window calculated on calendar days, not business days

**Scale/Scope**: ~5 new/modified client files, 2 new API routes, 1 new server-side
store, integration into existing booking form

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Next.js & React Best Practices | ✅ PASS | Flight validation service is a pure TypeScript module (no `'use client'` needed); concierge search uses App Router API route; existing form components updated via props |
| II. SEO-First Development | ✅ PASS | No new pages that require metadata; search endpoint is internal API |
| III. Performance & Core Web Vitals | ✅ PASS | Mock validation is fast (<300ms); no heavy assets added; API endpoints are lightweight |
| IV. Design System Compliance | ✅ PASS | Uses existing design tokens; date picker warning banner already present; no new visual components beyond validation status indicators |
| V. TypeScript Strictness & Code Quality | ✅ PASS | All new code in TypeScript strict mode; no `any` types; ESLint + Prettier configured |
| VI. Accessibility (WCAG) | ✅ PASS | Date input with native `min` attribute is natively accessible; validation status uses `aria-live` region; existing 44px touch targets and focus rings preserved |
| VII. Testing & Validation | ✅ PASS | Vitest tests for flight validation service, date enforcement logic, endpoint contract, and form integration |

**Gate verdict**: ✅ ALL PRINCIPLES PASS — no violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-flight-validation-tracking/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── flight-validation-api.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── booking/
│   │   └── route.ts              # MODIFIED — accept + store flight validation payload
│   └── bookings/
│       └── search/
│           └── route.ts          # NEW — concierge search by flightNumber + airline
└── components/
    └── booking/
        ├── booking-form.tsx          # MODIFIED — integrate flight validation
        ├── step-flight-logistics.tsx # MODIFIED — date min enforcement + flight validation UI
        ├── lib/
        │   ├── types.ts             # MODIFIED — add FlightValidationStatus, BookingFlag
        │   ├── flight-validation.ts # NEW — mock flight validation service
        │   ├── flight-data.ts       # NEW — mock reference flight data set
        │   └── booking-store.ts     # NEW — server-side in-memory booking store (for concierge search)
        └── __tests__/
            ├── flight-validation.test.ts  # NEW
            ├── date-enforcement.test.ts   # NEW
            └── booking-form.test.tsx      # MODIFIED — add flight validation scenarios
```

**Structure Decision**: Follows the existing pattern from 002 — a `lib/` directory for
new services/types/store, integration into the existing `booking-form.tsx` orchestrator,
and minimal changes to step components.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — all constitution principles pass. Complexity Tracking is empty.
