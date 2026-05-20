# Tasks: Fix Global i18n Coverage

**Input**: Design documents from `/specs/006-fix-i18n-global/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — test tasks excluded per specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Translation Keys)

**Purpose**: Add all missing translation keys to locale files before any component work begins

- [x] T001 [P] Add `errors`, `notFound`, `loading`, `stepProgress` sections to `lib/i18n/locales/en.ts`
- [x] T002 [P] Add `errors`, `notFound`, `loading`, `stepProgress` sections to `lib/i18n/locales/es.ts`
- [x] T003 [P] Add `booking.confirmation.nextSteps`, `booking.confirmation.bookAnother`, `common.processingPayment`, `common.payAndConfirm` to `lib/i18n/locales/en.ts`
- [x] T004 [P] Add `booking.confirmation.nextSteps`, `booking.confirmation.bookAnother`, `common.processingPayment`, `common.payAndConfirm` to `lib/i18n/locales/es.ts`
- [x] T005 [P] Add `booking.steps.destination.trips.*` keys with localized English variants to `lib/i18n/locales/en.ts`
- [x] T006 [P] Add `booking.steps.destination.trips.*` keys with Spanish values to `lib/i18n/locales/es.ts`

**Checkpoint**: All translation files have complete key structure for every component

---

## Phase 2: Foundational (Root Provider + Persistence + HTML lang)

**Purpose**: Core infrastructure that enables shared language state across the entire application

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Add `localStorage` read on initialization with SSR guard to `lib/i18n/index.tsx`
- [x] T008 Add `localStorage` write on `toggleLang`/`setLang` calls to `lib/i18n/index.tsx`
- [x] T009 Add `useEffect` to sync `document.documentElement.lang` with language state to `lib/i18n/index.tsx`
- [x] T010 Wrap `{children}` with `<I18nProvider>` in `app/layout.tsx`

**Checkpoint**: Root provider active, persistence working, HTML lang syncs dynamically

---

## Phase 3: User Story 1 — Language Switcher Affects Entire Page (Priority: P1) 🎯 MVP

**Goal**: Toggling the language switcher in the header updates ALL text on the landing page simultaneously

**Independent Test**: Load landing page → click language toggle → verify every section (header, hero, concierge, how-it-works, about, testimonials, CTA, footer) updates to the selected language

### Implementation for User Story 1

- [x] T011 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/layout/header.tsx` — keep `<HeaderInner>` as direct export
- [x] T012 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/layout/footer.tsx` — keep `<FooterInner>` as direct export
- [x] T013 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/hero/hero-section.tsx` — keep `<HeroInner>` as direct export
- [x] T014 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/concierge/concierge-section.tsx` — keep `<ConciergeInner>` as direct export
- [x] T015 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/how-it-works/how-it-works-section.tsx` — keep `<HowItWorksInner>` as direct export
- [x] T016 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/about/about-section.tsx` — keep `<AboutInner>` as direct export
- [x] T017 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/testimonials/testimonials-section.tsx` — keep `<TestimonialsInner>` as direct export
- [x] T018 [P] [US1] Remove `<I18nProvider>` wrapper from `app/components/cta/cta-section.tsx` — keep `<CtaInner>` as direct export
- [x] T019 [US1] Remove `<I18nProvider>` wrapper from `app/components/booking/booking-form.tsx` — keep `<ErrorBoundary>` and `<ToastProvider>` wrappers

**Checkpoint**: All 8 landing page sections + booking form inherit from root provider. Toggle language in header → all sections update simultaneously.

---

## Phase 4: User Story 3 — All Placeholder Pages Display Translated Text (Priority: P3)

**Goal**: Admin placeholder pages and sidebar navigation use translation keys instead of hardcoded English

**Independent Test**: Navigate to each admin placeholder page → toggle language → verify all text updates (title, description, "Coming Soon")

### Implementation for User Story 3

- [x] T020 [P] [US3] Add `'use client'` directive, import `useI18n`, replace hardcoded sidebar labels with `t.admin.nav.*` in `app/admin/layout.tsx`
- [x] T021 [P] [US3] Replace hardcoded "Concierge Elite" and "Admin" header text with `t.admin.nav.conciergeElite` and `t.admin.nav.admin` in `app/admin/layout.tsx`
- [x] T022 [P] [US3] Add `useI18n` import and replace hardcoded text with `t.admin.placeholders.*` keys in `app/admin/ia-chat/page.tsx`
- [x] T023 [P] [US3] Add `useI18n` import and replace hardcoded text with `t.admin.placeholders.*` keys in `app/admin/intelligence/page.tsx`
- [x] T024 [P] [US3] Add `useI18n` import and replace hardcoded text with `t.admin.placeholders.*` keys in `app/admin/logistics/page.tsx`
- [x] T025 [P] [US3] Add `useI18n` import and replace hardcoded text with `t.admin.placeholders.*` keys in `app/admin/grid/page.tsx`
- [x] T026 [P] [US3] Add `useI18n` import and replace hardcoded text with `t.admin.placeholders.*` keys in `app/admin/dispatch/page.tsx`

**Checkpoint**: Admin sidebar and all 5 placeholder pages display fully translated content when language is toggled.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Wire up remaining components that display hardcoded text (error pages, booking components)

- [x] T027 [P] Import translation objects directly and replace hardcoded strings in `app/error.tsx`
- [x] T028 [P] Import translation objects directly and replace hardcoded strings in `app/not-found.tsx`
- [x] T029 [P] Import translation objects directly and replace hardcoded strings in `app/loading.tsx`
- [x] T030 [P] Import translation objects directly and replace hardcoded strings in `app/components/booking/lib/error-boundary.tsx`
- [x] T031 [P] Add `useI18n` import and replace hardcoded step labels with `t.stepProgress.labels.*` in `app/components/booking/step-progress.tsx`
- [x] T032 [P] Add `useI18n` import and replace hardcoded "% Complete" with `t.stepProgress.complete` in `app/components/booking/step-progress.tsx`
- [x] T033 [P] Add `useI18n` import and replace hardcoded text with `t.booking.confirmation.*` keys in `app/components/booking/booking-confirmation.tsx`
- [x] T034 [P] Add `useI18n` import and replace hardcoded "Processing your payment..." and "Pay & Confirm" with `t.common.*` keys in `app/components/booking/payment-form.tsx`
- [x] T035 [P] Add `useI18n` import and replace hardcoded trip names with `t.booking.steps.destination.trips.*` keys in `app/components/booking/step-destination.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US3)**: Depends on Phase 2 completion — can run in parallel with Phase 3
- **Phase 5 (Polish)**: Depends on Phase 2 completion — can run in parallel with Phases 3 & 4

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 3 (P3)**: Can start after Phase 2 — No dependencies on US1
- **Polish tasks**: Can start after Phase 2 — Independent of US1 and US3

### Within Each User Story

- Core infrastructure (provider, persistence) before component wiring
- Translation keys before component wiring
- Each component modification is independent (different files)

### Parallel Opportunities

- All Phase 1 tasks (T001-T006) can run in parallel
- All Phase 2 tasks (T007-T010) are sequential (same file dependency)
- All Phase 3 tasks (T011-T019) can run in parallel (different component files)
- All Phase 4 tasks (T020-T026) can run in parallel (different admin page files)
- All Phase 5 tasks (T027-T035) can run in parallel (different component files)
- Phases 3, 4, and 5 can run in parallel after Phase 2 completes

---

## Parallel Example: User Story 1

```bash
# All provider removals can launch simultaneously (different files):
Task: "Remove I18nProvider from header.tsx"
Task: "Remove I18nProvider from footer.tsx"
Task: "Remove I18nProvider from hero-section.tsx"
Task: "Remove I18nProvider from concierge-section.tsx"
Task: "Remove I18nProvider from how-it-works-section.tsx"
Task: "Remove I18nProvider from about-section.tsx"
Task: "Remove I18nProvider from testimonials-section.tsx"
Task: "Remove I18nProvider from cta-section.tsx"
Task: "Remove I18nProvider from booking-form.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (translation keys)
2. Complete Phase 2: Foundational (root provider + persistence + html lang)
3. Complete Phase 3: User Story 1 (remove isolated providers)
4. **STOP and VALIDATE**: Toggle language on landing page — all sections must update
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready (shared state works)
2. Phase 3 (US1) → Landing page fully translated → Deploy/Demo (MVP!)
3. Phase 4 (US3) → Admin pages translated → Deploy/Demo
4. Phase 5 (Polish) → Error pages, booking components translated → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 + Phase 2 together
2. Once Phase 2 is done:
   - Developer A: Phase 3 (US1 — landing page sections)
   - Developer B: Phase 4 (US3 — admin pages)
   - Developer C: Phase 5 (Polish — error/booking components)
3. All phases complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each phase is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The root provider change (T010) is the single most critical task — it enables all other work
