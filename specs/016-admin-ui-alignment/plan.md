# Implementation Plan: Admin UI Alignment with HTML Reference

**Branch**: `016-admin-ui-alignment` | **Date**: 2026-05-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-admin-ui-alignment/spec.md`

## Summary

Align all 12 existing admin page UIs with their corresponding HTML reference designs from `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/`. Fix sidebar routing mismatches (fleet, payments, employees), replace hardcoded inline color values with CSS custom properties, implement missing UI components (date-nav bar, SVG charts, fleet analytics, vehicle modal, driver score ring), and preserve all existing functionality.

## Technical Context

**Language/Version**: TypeScript (strict)

**Primary Dependencies**: Next.js 16+, Tailwind CSS v3+, custom CSS design tokens

**Storage**: N/A (UI-only changes; existing data fetching patterns preserved)

**Testing**: Vitest + React Testing Library (visual regression testing manual)

**Target Platform**: Web (Vercel deployment)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: No performance regression — page load times within 10% of current

**Constraints**: All existing functionality must be preserved (data fetching, state management, event handlers); use CSS custom properties (var(--*)) over hardcoded values

**Scale/Scope**: 12 admin pages, shared admin layout, ~30 component files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Next.js App Router | ✅ PASS | UI updates on existing client components, no architectural change |
| II. SEO | ✅ PASS | Admin pages don't require public SEO metadata |
| III. Performance | ✅ PASS | No structural changes that would impact Core Web Vitals |
| IV. Design System | ✅ PASS | Aligning with the Medellín Admin design tokens from admin-shared.css |
| V. TypeScript Strictness | ✅ PASS | Existing patterns preserved |
| VI. Accessibility | ✅ PASS | Will verify color contrast and keyboard nav |
| VII. Testing | ⚠️ Check | Manual visual verification against HTML references required |
| VIII. Admin Dashboard | ✅ PASS | Directly improving admin dashboard as required |
| IX. Real-Time | ✅ PASS | No changes to real-time communication |

## Project Structure

```text
specs/016-admin-ui-alignment/
├── plan.md              # This file
├── spec.md              # Feature spec
├── plan.md              # Implementation plan

app/
├── globals.css          # Update to use CSS variables consistently
├── admin/
│   ├── layout.tsx       # Add date-nav bar, fix routing
│   ├── analytics/page.tsx
│   ├── customers/page.tsx
│   ├── dispatch/page.tsx
│   ├── drivers/page.tsx
│   ├── employees/page.tsx
│   ├── fleet/page.tsx
│   ├── inventory/page.tsx
│   ├── payments/page.tsx
│   ├── promotions/page.tsx
│   ├── reservations/page.tsx
│   ├── settings/page.tsx
│   ├── support/page.tsx
│   ├── logistics/page.tsx  # Route redirect /admin/logistics → /admin/fleet
│   ├── grid/page.tsx       # Route redirect /admin/grid → /admin/payments
│   └── team/page.tsx       # Route redirect /admin/team → /admin/employees
```

**Structure Decision**: Single project with app/ directory (Next.js App Router). All admin pages under `app/admin/`. This is a UI-only alignment — no new directories or modules needed.

## Complexity Tracking

*No constitution violations — this is a visual alignment task within existing architecture.*

## Phase 0: Research

### Setup Research

All technology choices are already known from the existing codebase and constitution. No NEEDS CLARIFICATION markers exist. The research phase focuses on analyzing the gap between current project UI and HTML reference.

### Research Tasks

1. **Audit CSS variable usage**: Scan all admin page .tsx files for hardcoded color values and map them to their CSS variable equivalents
2. **Audit routing mappings**: Verify sidebar nav links and page routes match the HTML reference structure
3. **Identify missing components**: Catalog all UI components present in HTML reference but missing from the project (date-nav bar, SVG charts, funnel, fleet analytics, vehicle modal, driver score ring, referral sources)
4. **Compare per-page layout**: For each of the 12 admin pages, create a diff of layout structure between current and HTML reference

## Phase 1: Design & Contracts

### Data Model

No new data entities required — this is a UI-only alignment. The existing reservation, customer, driver, etc. data types are unchanged.

### Contracts

No new API contracts — existing data fetching patterns (adminFetch, API routes) are preserved.

### Design Approach

1. **CSS Layer**: Use the already-copied CSS from admin-shared.css in globals.css. The variables and utility classes exist — the work is replacing inline styles with CSS variable references and class names.
2. **Component Layer**: For each admin page, restructure the JSX to match the HTML reference layout while preserving data fetching and state logic.
3. **Routing Layer**: Update sidebar links in layout.tsx and add redirects at old routes.

### Agent Context Update

Update AGENTS.md to reference this plan file.

## Implementation Tasks

### Task 1: CSS Design Token Audit & globals.css Cleanup

**Files:**
- Modify: `app/globals.css`

**Rationale**: The admin CSS classes and variables are already in globals.css but may need review for completeness.

- [ ] **Step 1**: Verify all CSS variables from admin-shared.css are defined in globals.css
- [ ] **Step 2**: Verify all CSS utility classes from admin-shared.css are present
- [ ] **Step 3**: Commit: `git commit -m "feat: audit admin CSS design tokens"`

### Task 2: Fix Sidebar Routing Mismatches

**Files:**
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1**: Change "Fleet" sidebar link from `/admin/logistics` to `/admin/fleet`
- [ ] **Step 2**: Change "Payments" sidebar link from `/admin/grid` to `/admin/payments`
- [ ] **Step 3**: Change "Employees" sidebar link from `/admin/team` to `/admin/employees` (or merge)
- [ ] **Step 4**: Add redirect from `/admin/logistics` to `/admin/fleet`
- [ ] **Step 5**: Add redirect from `/admin/grid` to `/admin/payments`
- [ ] **Step 6**: Commit: `git commit -m "fix: correct sidebar routing for fleet, payments, employees"`

### Task 3: Add Date Navigation Bar to Admin Layout

**Files:**
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1**: Add date-nav bar component between topbar and content in admin layout
- [ ] **Step 2**: Implement prev/next date arrows, "Today" button, date range label, Day/Week/Month/Year toggle
- [ ] **Step 3**: Commit: `git commit -m "feat: add date navigation bar to admin layout"`

### Task 4: Refactor Inline Styles to CSS Variables — All Admin Pages

**Files:**
- Modify: `app/admin/reservations/page.tsx`
- Modify: `app/admin/customers/page.tsx`
- Modify: `app/admin/drivers/page.tsx`
- Modify: `app/admin/dispatch/page.tsx`
- Modify: `app/admin/employees/page.tsx`
- Modify: `app/admin/fleet/page.tsx`
- Modify: `app/admin/inventory/page.tsx`
- Modify: `app/admin/payments/page.tsx`
- Modify: `app/admin/promotions/page.tsx`
- Modify: `app/admin/settings/page.tsx`
- Modify: `app/admin/support/page.tsx`
- Modify: `app/admin/analytics/page.tsx`
- Modify: `app/admin/orders/page.tsx`
- Modify: `app/admin/intelligence/page.tsx`

- [ ] **Step 1**: Replace all hardcoded hex values (`#0b0d14`, `#181b25`, `#282b38`, `#646880`, `#f0f2f5`, etc.) with `var(--*)` references
- [ ] **Step 2**: Replace inline `style` objects with CSS class names (.card, .badge, .btn, .input, etc.) where applicable
- [ ] **Step 3**: Commit: `git commit -m "refactor: replace hardcoded colors with CSS variables across all admin pages"`

### Task 5: Align Reservations Page UI with HTML Reference

**Files:**
- Modify: `app/admin/reservations/page.tsx`
- Modify: `app/admin/reservations/components/ReservationKPIs.tsx`
- Modify: `app/admin/reservations/components/ReservationFilters.tsx`
- Modify: `app/admin/reservations/components/ReservationTable.tsx`
- Modify: `app/admin/reservations/components/ReservationDetailModal.tsx`
- Modify: `app/admin/reservations/components/ReservationTimeline.tsx`
- Reference: `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/admin-reservations.html`

- [ ] **Step 1**: Match KPI row layout (6-column grid with colored top bars per status)
- [ ] **Step 2**: Match filter-tabs component styling (pills with active state)
- [ ] **Step 3**: Match table layout and res-table-section grid (table + timeline)
- [ ] **Step 4**: Match timeline card styling with colored dots and connectors
- [ ] **Step 5**: Match detail modal layout (wide modal with tabs for guest info, services, timeline, notes, payments)
- [ ] **Step 6**: Commit: `git commit -m "feat: align reservations page UI with HTML reference"`

### Task 6: Align Analytics Page UI with HTML Reference

**Files:**
- Modify: `app/admin/analytics/page.tsx`
- Modify: `app/admin/intelligence/page.tsx`
- Reference: `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/admin-analytics.html`

- [ ] **Step 1**: Implement SVG line charts and bar charts with gradients
- [ ] **Step 2**: Implement conversion funnel visualization (5-step gradient bars)
- [ ] **Step 3**: Add top drivers table section
- [ ] **Step 4**: Match KPI card styling with colored top accent bars
- [ ] **Step 5**: Commit: `git commit -m "feat: align analytics page UI with HTML reference"`

### Task 7: Align Fleet Page UI with HTML Reference

**Files:**
- Modify: `app/admin/fleet/page.tsx`
- Reference: `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/admin-fleet.html`

- [ ] **Step 1**: Implement fleet analytics section (utilization gauge ring, fuel efficiency bars, maintenance schedule)
- [ ] **Step 2**: Implement vehicle detail modal (document check, utilization gauge, health indicators)
- [ ] **Step 3**: Add health indicators to vehicle cards
- [ ] **Step 4**: Commit: `git commit -m "feat: align fleet page UI with HTML reference"`

### Task 8: Align Drivers Page UI with HTML Reference

**Files:**
- Modify: `app/admin/drivers/page.tsx`
- Reference: `/Users/frg/Downloads/LocalPlug-·-5_16_2026_2/admin-drivers.html`

- [ ] **Step 1**: Implement driver condition score ring (conic gradient SVG)
- [ ] **Step 2**: Align driver cards with HTML reference layout
- [ ] **Step 3**: Align side panel styling with HTML reference
- [ ] **Step 4**: Commit: `git commit -m "feat: align drivers page UI with HTML reference"`

### Task 9: Align Remaining Admin Pages UI

**Files:**
- Modify: `app/admin/customers/page.tsx`
- Modify: `app/admin/dispatch/page.tsx`
- Modify: `app/admin/employees/page.tsx`
- Modify: `app/admin/inventory/page.tsx`
- Modify: `app/admin/payments/page.tsx`
- Modify: `app/admin/promotions/page.tsx`
- Modify: `app/admin/settings/page.tsx`
- Modify: `app/admin/support/page.tsx`
- Reference: Corresponding HTML files in Downloads folder

- [ ] **Step 1**: Align customers page — verify slide-in panel matches HTML reference
- [ ] **Step 2**: Align dispatch page — verify 3-column layout matches
- [ ] **Step 3**: Align employees page — verify table and side panel match
- [ ] **Step 4**: Align inventory page — add search bar
- [ ] **Step 5**: Align payments page — add Stripe integration card, revenue grid
- [ ] **Step 6**: Align promotions page — add referral sources section
- [ ] **Step 7**: Align settings page — verify all sections match
- [ ] **Step 8**: Align support page — verify chat UI matches
- [ ] **Step 9**: Commit: `git commit -m "feat: align remaining admin pages UI with HTML references"`

### Task 10: Final Verification

**Files:**
- Verify: All modified admin pages

- [ ] **Step 1**: Verify each admin page visually matches its HTML reference
- [ ] **Step 2**: Verify all existing functionality works (data loads, filters, modals, CRUD)
- [ ] **Step 3**: Verify responsive design at mobile, tablet, desktop breakpoints
- [ ] **Step 4**: Verify no hardcoded colors remain in admin page .tsx files
- [ ] **Step 5**: Run type checking: `npx tsc --noEmit`
- [ ] **Step 6**: Run linting: `npm run lint`
- [ ] **Step 7**: Commit: `git commit -m "feat: complete admin UI alignment with HTML reference"`
