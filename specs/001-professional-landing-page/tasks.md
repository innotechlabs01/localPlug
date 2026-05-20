# Tasks: Professional Landing Page

**Input**: Design documents from `specs/001-professional-landing-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Component-level tests for critical interactive components (contact form). Lighthouse CI for performance/SEO/a11y audits per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/` directory at repository root
- **Components**: `app/components/` organized by section
- **Tests**: `tests/components/` for Vitest + RTL, `tests/e2e/` for Playwright
- **Lib**: `lib/` for shared utilities

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 14+ project with App Router, TypeScript, and Tailwind CSS via `pnpm create next-app`
- [ ] T002 [P] Configure TypeScript strict mode in `tsconfig.json`
- [ ] T003 [P] Configure ESLint with `next/core-web-vitals` and Prettier in `.eslintrc.json` and `.prettierrc`
- [ ] T004 [P] Configure Tailwind CSS with Premium Andean Hospitality design tokens in `tailwind.config.js` (colors, fonts, spacing, border radii)
- [ ] T005 [P] Create folder structure: `app/components/hero/`, `app/components/services/`, `app/components/how-it-works/`, `app/components/contact/`, `app/components/layout/`, `app/components/ui/`, `lib/`, `public/images/`, `tests/components/`, `tests/e2e/`
- [ ] T006 [P] Configure Vitest + React Testing Library in `vitest.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create root layout in `app/layout.tsx` with Plus Jakarta Sans (headlines) and Inter (body) via `next/font`, global HTML lang attribute, and `metadataBase` set to environment variable
- [ ] T008 Create `app/globals.css` with Tailwind directives and CSS custom properties for all Premium Andean Hospitality design tokens (colors, shadows, spacing, radii)
- [ ] T009 Create `lib/design-tokens.ts` with exported constants for design system values
- [ ] T010 [P] Create shared Button component in `app/components/ui/button.tsx` with variants (primary/Slate Navy, secondary/Mountain Emerald, ghost/outline)
- [ ] T011 [P] Create shared Input component in `app/components/ui/input.tsx` with label, error state, and Emerald focus glow styling
- [ ] T012 Create Header component in `app/components/layout/header.tsx` with brand name, navigation links, mobile hamburger menu trigger
- [ ] T013 Create Footer component in `app/components/layout/footer.tsx` with copyright, social links, contact info
- [ ] T014 Create `app/loading.tsx` (skeleton loaders) and `app/error.tsx` (error boundary) for root level

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Landing Page Hero & Value Proposition (Priority: P1) 🎯 MVP

**Goal**: Hero section with brand name, value proposition, and primary CTA that establishes trust and communicates the premium concierge service.

**Independent Test**: Load the page and verify the hero displays "Medellín Stress-Free Arrival" brand headline, supporting subtitle, and Mountain Emerald CTA button within 3 seconds. Design matches Premium Andean Hospitality tokens. Responsive on desktop (1280px+) and mobile (390px).

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create HeroSection component in `app/components/hero/hero-section.tsx` with Slate Navy background, brand headline, subtitle, and CTA button slot
- [ ] T016 [P] [US1] Create HeroCta component in `app/components/hero/hero-cta.tsx` with Mountain Emerald primary button and optional secondary link
- [ ] T017 [US1] Build hero content: "Medellín Stress-Free Arrival" headline, value proposition subtitle, and primary CTA ("Book Your Arrival")
- [ ] T018 [US1] Compose `app/page.tsx` with HeroSection as the first section using React Server Component pattern

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Services & How It Works (Priority: P1)

**Goal**: Services section with at least 4 service cards and a "How It Works" process with 3-4 numbered steps.

**Independent Test**: Scroll to services section and verify all service cards display with consistent design (white background, Level 1 shadow, 16px padding, 8px corner radius). "How It Works" steps are numbered and visually sequential. Mobile: cards stack vertically.

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create ServiceCard component in `app/components/services/service-card.tsx` with icon, title, description, optional CTA, Premium Andean Hospitality card styling
- [ ] T020 [P] [US2] Create ServicesSection component in `app/components/services/services-section.tsx` with responsive grid (4 columns desktop, 1 column mobile) and at least 4 service cards
- [ ] T021 [P] [US2] Create StepCard component in `app/components/how-it-works/step-card.tsx` with number badge, icon, title, description
- [ ] T022 [P] [US2] Create HowItWorksSection component in `app/components/how-it-works/how-it-works-section.tsx` with 3-4 numbered steps in sequential layout
- [ ] T023 [US2] Add ServicesSection and HowItWorksSection to `app/page.tsx` after the hero section

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Premium Design & Visual Storytelling (Priority: P2)

**Goal**: All sections convey luxury through high-quality imagery, polished micro-interactions, and consistent application of the Premium Andean Hospitality design system.

**Independent Test**: Visual design review against design tokens — all colors match Slate Navy, Mountain Emerald, Golden Sol palette. Typography uses correct fonts. No sharp 0px corners. Hover states show smooth transitions (200-300ms).

### Implementation for User Story 3

- [ ] T024 [P] [US3] Add hover and focus transition effects (200-300ms, shadow elevation, Emerald glow) to all interactive components in `app/components/ui/button.tsx` and `app/components/ui/input.tsx`
- [ ] T025 [P] [US3] Add hover card elevation effect to ServiceCard in `app/components/services/service-card.tsx` (Level 1 → Level 2 shadow)
- [ ] T026 [P] [US3] Add decorative icons (using SVG or heroicons) to ServiceCard and StepCard components for visual appeal
- [ ] T027 [US3] Audit all components for design token compliance: verify colors, typography, spacing (8px base), corner radii (8px/16px), and shadows match the design system exactly
- [ ] T028 [US3] Ensure all images use `next/image` with explicit width/height, `sizes` prop, WebP format, and 16px border radius on featured images

**Checkpoint**: User Stories 1, 2, AND 3 now all work independently with premium visual polish

---

## Phase 6: User Story 4 - SEO & Social Sharing Optimization (Priority: P2)

**Goal**: Page fully optimized for search engines and social media with metadata, structured data, sitemap, robots.txt, and OG image generation.

**Independent Test**: Lighthouse SEO score 90+. Open Graph tags render correctly on social preview tools. Valid JSON-LD for Organization and LocalBusiness. Sitemap accessible at `/sitemap.xml`.

### Implementation for User Story 4

- [ ] T029 [P] [US4] Add metadata export in `app/layout.tsx` with sitewide title, description, canonical URL, Open Graph, and Twitter card tags using Next.js Metadata API
- [ ] T030 [P] [US4] Create `app/sitemap.ts` returning MetadataRoute.Sitemap with the landing page URL and last modified date
- [ ] T031 [P] [US4] Create `app/robots.ts` returning MetadataRoute.Robots allowing all crawlers and referencing sitemap
- [ ] T032 [P] [US4] Create `app/opengraph-image.tsx` using `@vercel/og` ImageResponse to generate a 1200x630px OG image with brand name and design
- [ ] T033 [P] [US4] Add JSON-LD structured data script in root layout with Organization and LocalBusiness schemas for Premium Andean Hospitality
- [ ] T034 [US4] Run Lighthouse SEO audit and verify score 90+; validate structured data with Google Rich Results Test

**Checkpoint**: User Stories 1-4 now work independently with full SEO optimization

---

## Phase 7: User Story 5 - Responsive & Mobile-First Experience (Priority: P3)

**Goal**: All sections fully functional and beautiful on mobile (390px), tablet (768px), and desktop (1280px+) viewports.

**Independent Test**: Load page on 390px viewport — all content accessible, CTAs tappable (44x44px min), no horizontal scroll, text readable without zooming. Tablet uses 8-column grid with 20px gutters.

### Implementation for User Story 5

- [ ] T035 [P] [US5] Add responsive breakpoint styles to Header: hamburger menu icon on mobile, full nav on desktop with sticky positioning and backdrop blur
- [ ] T036 [P] [US5] Add responsive grid to ServicesSection: 1 column on mobile, 2 on tablet, 4 on desktop
- [ ] T037 [P] [US5] Add responsive layout to HowItWorksSection: vertical steps on mobile, horizontal on desktop
- [ ] T038 [P] [US5] Add responsive styles to HeroSection: reduced font sizes on mobile, full headline on desktop with proper container max-width
- [ ] T039 [P] [US5] Ensure all touch targets are minimum 44x44px across all interactive elements
- [ ] T040 [P] [US5] Ensure all text is minimum 16px font-size on mobile viewport
- [ ] T041 [US5] Responsive audit: test all sections on 390px, 768px, and 1280px+ viewports; fix any overflow, clipping, or layout issues

**Checkpoint**: User Stories 1-5 now work independently with full responsive support

---

## Phase 8: User Story 6 - Contact & Booking Inquiry Section (Priority: P3)

**Goal**: Contact form with validation that gracefully handles valid and invalid submissions, styled with the Premium Andean Hospitality design system.

**Independent Test**: Navigate to contact section and submit with invalid data — error messages displayed per field. Submit with valid data — success confirmation shown. Network failure shows retry message.

### Implementation for User Story 6

- [ ] T042 [P] [US6] Create ContactForm client component (`'use client'`) in `app/components/contact/contact-form.tsx` with name, email, phone (optional), message fields
- [ ] T043 [US6] Implement form validation: name (required, min 2 chars), email (required, valid format), message (required, min 10 chars) with inline error messages
- [ ] T044 [US6] Implement form submission handler in ContactForm: POST to `/api/contact` endpoint per contract, with loading state, success message, and error handling (including network failure)
- [ ] T045 [P] [US6] Create ContactSection component in `app/components/contact/contact-section.tsx` wrapping ContactForm with section heading and Premium Andean Hospitality styling
- [ ] T046 [US6] Add ContactSection to `app/page.tsx` as the final section
- [ ] T047 [P] [US6] Create `app/api/contact/route.ts` POST handler that validates the request body against the contact contract and returns appropriate JSON responses (200 success, 400 validation error, 500 server error)
- [ ] T048 [US6] Write Vitest component tests for ContactForm in `tests/components/contact-form.test.tsx` covering validation rules, submission states, and error display

**Checkpoint**: All user stories now independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final quality assurance, Lighthouse CI, and refinements

- [ ] T049 [P] Configure Lighthouse CI in `.github/workflows/lighthouse.yml` for performance/SEO/a11y audits on PR preview deployments
- [ ] T050 Add `not-found.tsx` at `app/not-found.tsx` with branded 404 page design
- [ ] T051 Run full Lighthouse audit and fix any issues below 90 in Performance, Accessibility, Best Practices, or SEO
- [ ] T052 Verify all acceptance scenarios from the spec are satisfied through manual testing on mobile, tablet, and desktop
- [ ] T053 Final code cleanup: remove console.log, verify TypeScript strict mode passes with no errors, run ESLint and Prettier across all files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US1 and US2 (P1) share no file dependencies - can be built in parallel
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories (hero section is self-contained)
- **US2 (P1)**: No dependencies on other stories (services/process are self-contained)
- **US3 (P2)**: Depends on US1 and US2 existing (polishes existing components)
- **US4 (P2)**: Partial dependency on Phase 2 layout (metadata in layout)
- **US5 (P3)**: Depends on US1-3 existing (responsive fixes across components)
- **US6 (P3)**: No dependencies on other stories (contact section is self-contained)

### Internal Execution Order Per Phase

- Tasks marked [P] can run in parallel (different files, no dependencies)
- Non-[P] tasks must run sequentially within their phase
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks T002-T006 marked [P] can run in parallel after T001
- Foundational tasks T010-T011 marked [P] can run in parallel
- US1: T015-T016 can run in parallel
- US2: T019-T022 can run in parallel
- US4: T029-T033 can run in parallel
- US5: T035-T040 can run in parallel (each component independently)
- US6: T042, T045, T047 can run in parallel; T048 depends on T042
- Different user stories can be worked on in parallel by different team members (if staffed)

---

## Parallel Example: User Story 1

```bash
# Launch all components for User Story 1 together:
Task: "Create HeroSection component in app/components/hero/hero-section.tsx"
Task: "Create HeroCta component in app/components/hero/hero-cta.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Hero)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Hero) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Services & Process) → Test independently → Deploy/Demo
4. Add US3 (Design Polish) → Test independently → Deploy/Demo
5. Add US4 (SEO) → Test independently → Deploy/Demo
6. Add US5 (Responsive) → Test independently → Deploy/Demo
7. Add US6 (Contact Form) → Test independently → Deploy/Demo
8. Add Polish (Lighthouse CI, final QA)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Hero) + US4 (SEO)
   - Developer B: US2 (Services) + US6 (Contact)
   - Developer C: US3 (Design Polish) + US5 (Responsive)
3. All stories integrate independently and are merged incrementally

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All components use Premium Andean Hospitality design tokens as configured in Phase 1
- Server components by default; only ContactForm uses `'use client'`
