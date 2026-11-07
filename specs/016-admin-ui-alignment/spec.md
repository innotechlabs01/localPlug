# Feature Specification: Admin UI Alignment with HTML Reference

**Feature Branch**: `016-admin-ui-alignment`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "analiza toda la UI /Users/frg/Downloads/LocalPlug-·-5_16_2026_2 revisando mi proyecto no esta igual a la UI de html, quiero tener la misma UI de html en mi proyecto"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Match Visual Design of All Admin Pages (Priority: P1)

An admin user accesses any admin page (reservations, customers, drivers, analytics, fleet, payments, etc.) and sees a UI that exactly matches the HTML reference design — same colors, spacing, typography, card styles, button styles, badge styles, table styles, and layout structure.

**Why this priority**: Visual consistency across all admin pages is the core requirement. Without this, the user cannot verify the feature is complete.

**Independent Test**: Navigate to each admin page and compare visually against the corresponding HTML file in /Users/frg/Downloads/LocalPlug-·-5_16_2026_2/. All visual elements (colors, spacing, border radii, shadows, fonts) must match.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** viewing any admin page, **Then** the page uses the design system CSS variables (var(--bg), var(--surface), var(--fg), var(--accent), etc.) instead of hardcoded inline color values
2. **Given** an admin is viewing a page with cards (KPI cards, stat cards), **When** the page renders, **Then** card styles match the HTML reference (background, border, border-radius, padding, shadow)
3. **Given** an admin is viewing a page with buttons, **When** the page renders, **Then** button styles match the HTML reference (background, color, padding, border-radius, hover effects)
4. **Given** an admin is viewing a page with tables, **When** the page renders, **Then** table styles match the HTML reference (header styling, row hover, cell padding, font sizes)
5. **Given** an admin is viewing a page with badges or status indicators, **When** the page renders, **Then** badge styles match the HTML reference (colors, border-radius, font-size)

---

### User Story 2 - Fix Routing Mismatches (Priority: P1)

The sidebar navigation routes correctly to the appropriate admin pages — fleet links to the full fleet page, payments links to the comprehensive payments page, and employees/team are properly distinguished.

**Why this priority**: Broken navigation prevents users from accessing the correct pages, making the UI alignment meaningless.

**Independent Test**: Click each sidebar navigation link and verify it navigates to the correct page that matches the HTML reference.

**Acceptance Scenarios**:

1. **Given** an admin clicks "Fleet" in the sidebar, **When** navigating, **Then** the URL is /admin/fleet and shows the fleet management UI from admin-fleet.html
2. **Given** an admin clicks "Payments" in the sidebar, **When** navigating, **Then** the URL is /admin/payments and shows the payments UI from admin-payments.html
3. **Given** an admin clicks "Employees" in the sidebar, **When** navigating, **Then** the correct employees page is shown

---

### User Story 3 - Implement Missing UI Components (Priority: P2)

All UI components present in the HTML reference but missing from the project are implemented: date navigation bar, analytics visualizations (charts, funnel), fleet analytics section, vehicle detail modal, driver score ring.

**Why this priority**: These components are necessary for feature parity with the HTML reference but some pages can still function without them.

**Independent Test**: Navigate to the relevant page and verify the missing component now renders and matches the HTML reference design.

**Acceptance Scenarios**:

1. **Given** an admin is on any page with date navigation, **When** the page loads, **Then** the date-nav bar is visible with prev/next arrows, "Today" button, date range label, and Day/Week/Month/Year toggle
2. **Given** an admin is on the analytics page, **When** the page loads, **Then** SVG line charts, bar charts, and conversion funnel visualization are displayed matching admin-analytics.html
3. **Given** an admin is on the fleet page, **When** viewing a vehicle, **Then** clicking it opens a detail modal matching admin-fleet.html

---

### Edge Cases

- What happens when a page has no HTML reference equivalent (e.g., Team, Agenda, Cases)?
- How does the system handle pages that exist under multiple routes (payments vs grid, fleet vs logistics)?
- What if CSS variable overrides conflict with existing Tailwind utility classes?
- How are JavaScript-dependent interactions in the HTML (modals, tabs, toggles) translated to React state?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All admin pages MUST use CSS custom properties (var(--bg), var(--surface), var(--fg), var(--accent), etc.) for colors instead of hardcoded inline hex values
- **FR-002**: All admin pages MUST use the same CSS class naming as the HTML reference (.card, .card-header, .card-body, .btn, .btn-primary, .badge, .badge-accent, .input, etc.) for consistent styling
- **FR-003**: The sidebar navigation MUST route fleet to /admin/fleet, payments to /admin/payments, and employees to the correct employees page
- **FR-004**: All pages with date filtering MUST include the date-nav bar component matching admin-shared.css design
- **FR-005**: The analytics page MUST include SVG line charts, bar charts with gradients, conversion funnel visualization, and top drivers table matching admin-analytics.html
- **FR-006**: The fleet page MUST include the fleet analytics section (utilization gauge, fuel efficiency bars, maintenance metrics) and vehicle detail modal matching admin-fleet.html
- **FR-007**: The drivers page MUST include the visual condition score ring (conic gradient SVG) matching admin-drivers.html
- **FR-008**: The promotions page MUST include the referral source analytics section matching admin-promotions.html
- **FR-009**: The inventory page MUST include a search bar for filtering inventory items matching admin-inventory.html
- **FR-010**: All modals and interactive elements (filters, dropdowns, tabs) MUST match the visual design of their corresponding HTML reference

### Key Entities *(include if feature involves data)*

- **Admin Page**: Represents each administrative interface (analytics, customers, dispatch, drivers, employees, fleet, inventory, payments, promotions, reservations, settings, support)
- **Design System Token**: CSS custom properties defined in admin-shared.css that provide consistent colors, spacing, typography, and shadows
- **UI Component**: Reusable visual elements (cards, buttons, badges, tables, modals, tabs, charts, navigation bars) extracted from HTML reference
- **Date Navigation Bar**: A sticky strip with date controls (prev/next, today button, date range label, view toggle) present on most admin pages
- **Route Mapping**: The relationship between sidebar navigation links and their corresponding page routes

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every admin page visually matches its corresponding HTML reference file — verified by side-by-side comparison with zero visual discrepancies in layout, colors, spacing, and typography
- **SC-002**: All CSS color values across admin pages use CSS custom properties (var(--*)) instead of hardcoded hex values — 100% compliance
- **SC-003**: All sidebar navigation links route to the correct page matching the HTML reference — verified by clicking each link
- **SC-004**: Missing UI components (date-nav bar, charts, funnel, fleet analytics, vehicle modal, score ring, referral sources, search bar) are implemented for their respective pages
- **SC-005**: All existing functionality (data fetching, filtering, CRUD operations, state management) is preserved after UI updates — zero regressions

---

## Assumptions

- The HTML files in /Users/frg/Downloads/LocalPlug-·-5_16_2026_2/ represent the complete and correct target design for all admin pages
- The admin-shared.css file contains the canonical design system tokens that should be used across all admin pages
- Existing React state management, data fetching, and event handlers should be preserved — only visual presentation should change
- Pages without a direct HTML reference equivalent (Team, Agenda, Cases) should maintain their current design without changes
- The project may use Tailwind CSS utility classes alongside the CSS custom properties where appropriate, as long as the visual result matches the HTML reference
