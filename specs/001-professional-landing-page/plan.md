# Implementation Plan: Professional Landing Page

**Branch**: `001-professional-landing-page` | **Date**: 2026-05-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-professional-landing-page/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a professional, high-performance Next.js landing page for the Premium Andean Hospitality (Medellín Stress-Free Arrival) concierge service. The page includes a hero section with value proposition, services grid, "How It Works" process, and contact inquiry form — all styled with the Premium Andean Hospitality design system (Slate Navy, Mountain Emerald, Golden Sol) and optimized for SEO, Core Web Vitals, accessibility, and responsive design across mobile/tablet/desktop.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode

**Primary Dependencies**: Next.js 14+ (App Router), Tailwind CSS v3+, next/font, @next/mdx (if needed)

**Storage**: N/A — static landing page with client-side contact form (no persistent storage required)

**Testing**: Vitest + React Testing Library (component tests), Playwright (E2E), Lighthouse CI (performance/SEO/a11y audits)

**Target Platform**: Modern web browsers (Chrome, Safari, Firefox, Edge — last 2 major versions)

**Project Type**: Web application — frontend-only landing page (Next.js static export / Vercel deployment)

**Performance Goals**: Lighthouse 90+ all categories, LCP < 2.5s, CLS < 0.1, INP < 200ms

**Constraints**: WCAG 2.1 AA compliance, responsive at 3 breakpoints (390px / 768px / 1280px+), container max-width 1280px, 8px base spacing unit, no sharp 0px corners

**Scale/Scope**: Single landing page (5-6 visible sections), SEO-critical, ~6 user stories across P1-P3 priorities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Next.js & React Best Practices | ✅ PASS | Spec requires server-rendered landing page with App Router conventions; plan enforces RSC by default, client components only for interactivity |
| II. SEO-First Development | ✅ PASS | FR-005 & FR-006 require metadata, OG tags, JSON-LD; SC-002 & SC-008 validate SEO score and structured data |
| III. Performance & Core Web Vitals | ✅ PASS | SC-001–SC-005 set measurable Lighthouse and CWV targets aligned with constitution |
| IV. Design System Compliance | ✅ PASS | US-3 acceptance criteria explicitly require Premium Andean Hospitality design tokens (colors, typography, spacing, radii) |
| V. TypeScript Strictness & Code Quality | ✅ PASS | Strict mode mandated by constitution; enforced during implementation (code quality checks in CI) |
| VI. Accessibility (WCAG) | ✅ PASS | FR-009 requires focus indicators and keyboard access; SC-003 requires Lighthouse Accessibility 90+ |
| VII. Testing & Validation | ✅ PASS | SC-001 (Lighthouse Perf), SC-002 (SEO), SC-003 (A11y), SC-004 (LCP), SC-005 (CLS) all define measurable thresholds |

**Gate verdict**: ✅ ALL PRINCIPLES PASS — no violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-professional-landing-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Option 2: Web application (Next.js)
app/
├── layout.tsx            # Root layout (fonts, metadata, fonts preload)
├── page.tsx              # Landing page — server component
├── loading.tsx           # Loading state
├── error.tsx             # Error boundary
├── not-found.tsx         # 404 page
├── globals.css           # Tailwind imports + design token CSS variables
├── sitemap.ts            # Dynamic sitemap generation
├── robots.ts             # Robots.txt
├── opengraph-image.tsx   # OG image generation
└── components/
    ├── hero/
    │   └── hero-section.tsx, hero-cta.tsx
    ├── services/
    │   ├── services-section.tsx
    │   └── service-card.tsx
    ├── how-it-works/
    │   ├── how-it-works-section.tsx
    │   └── step-card.tsx
    ├── contact/
    │   ├── contact-section.tsx
    │   └── contact-form.tsx (client component)
    ├── layout/
    │   ├── header.tsx
    │   └── footer.tsx
    └── ui/
        ├── button.tsx
        └── input.tsx

lib/
├── design-tokens.ts      # Design system token constants
└── metadata.ts           # Shared metadata helpers

public/
├── images/               # Static image assets
└── favicon.ico

tests/
├── components/           # Vitest + RTL component tests
└── e2e/                  # Playwright E2E tests
```

**Structure Decision**: Web application (Option 2) — single Next.js project with App Router. All source code lives under `app/` following Next.js 14+ file conventions. Components are organized by section (hero, services, how-it-works, contact, layout, ui). No backend required — this is a frontend-only landing page.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — all constitution principles pass. Complexity Tracking is empty.
