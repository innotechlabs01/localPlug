# Feature Specification: Admin Dashboard with Order Queue & i18n

**Feature Branch**: `005-admin-dashboard-i18n`

**Created**: 2026-05-16

**Status**: Draft

**Input**: User description: "baseline specification for admin dashboard with order queue, roles, permissions, and i18n translations for all admin pages"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Dashboard Overview (Priority: P1)

An administrator logs into the admin panel and sees a dashboard with key metrics: total orders, new orders, in-progress orders, and urgent orders. The dashboard shows recent orders in a table with status, priority, and customer info. The admin can click on any order to view details.

**Why this priority**: The dashboard is the entry point for all admin operations and provides immediate visibility into business metrics.

**Independent Test**: Navigate to `/admin` — verify stats cards show correct counts, recent orders table renders with 5+ rows, and all status/priority badges display with correct colors.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they navigate to `/admin`, **Then** they see a dashboard with 4 stat cards (Total, New, In Progress, Urgent) and a recent orders table.

2. **Given** the dashboard is loaded, **When** the admin views the stats, **Then** each card shows a count that matches the actual order data in the system.

3. **Given** the admin views the recent orders table, **When** they see an order row, **Then** it displays order number, customer name, package, status badge, priority badge, and date.

---

### User Story 2 - Order Queue Management (Priority: P1)

An administrator views the order queue with filtering and search capabilities. They can filter by status (new, confirmed, in_progress, on_hold, completed, cancelled) and priority (low, normal, high, urgent). They can search by order number, customer name, or email. The admin can view order details and update status.

**Why this priority**: Order queue is the core operational tool for the concierge team to manage customer bookings.

**Independent Test**: Navigate to `/admin/orders` — verify status tabs with counts, search input filters orders, priority dropdown filters orders, and each order row shows all required fields.

**Acceptance Scenarios**:

1. **Given** the admin is on the orders page, **When** they view the status tabs, **Then** each tab shows the count of orders in that status (All, New, Confirmed, In Progress, On Hold, Completed, Cancelled).

2. **Given** the admin types in the search box, **When** they enter "Sarah", **Then** only orders with "Sarah" in the name, email, or order number are displayed.

3. **Given** the admin selects a status tab, **When** they click "New", **Then** only orders with status "new" are shown.

4. **Given** the admin selects a priority filter, **When** they choose "Urgent", **Then** only orders with "urgent" priority are displayed.

5. **Given** the admin views an order row, **When** they see the order, **Then** it displays: order number, booking reference, customer name/email, package name/price, flight number/arrival date, status badge, priority badge, payment status, and action buttons.

---

### User Story 3 - Team Management (Priority: P2)

An administrator views the team operations hub showing all team members with their roles, status, and assigned order counts. The admin can see who is active and how many orders each person is handling.

**Why this priority**: Team visibility is important for workload distribution but not critical for initial order processing.

**Independent Test**: Navigate to `/admin/team` — verify team member cards show name, email, role badge, status indicator, and assigned order count.

**Acceptance Scenarios**:

1. **Given** the admin is on the team page, **When** they view the team members, **Then** each member card shows name, email, role (with color badge), active/inactive status, and number of assigned orders.

2. **Given** the admin views a team member, **When** the member is active, **Then** a green status badge is shown; if inactive, a gray badge is shown.

---

### User Story 4 - Monthly Agenda (Priority: P2)

An administrator views the monthly agenda showing scheduled activities (arrivals, departures, meetings, tasks) sorted by time. The admin can select a date and see all activities for that day.

**Why this priority**: The agenda helps the team plan daily operations but is not required for order processing.

**Independent Test**: Navigate to `/admin/agenda` — verify activities are sorted by time, each activity shows type badge, customer name, and status.

**Acceptance Scenarios**:

1. **Given** the admin is on the agenda page, **When** they view the activities, **Then** activities are sorted by time (earliest first) and each shows: time, title, customer name, type badge (arrival/departure/meeting/task), and status.

2. **Given** the admin selects a different date, **When** they use the date picker, **Then** the agenda updates to show activities for the selected date.

---

### User Story 5 - i18n Language Toggle (Priority: P1)

All admin pages support English/Spanish language switching via a flag toggle. When the admin switches language, all text on the current page updates instantly without page reload.

**Why this priority**: i18n is a core requirement for the bilingual concierge team serving international and local clients.

**Independent Test**: On any admin page, click the language toggle — verify all visible text switches between English and Spanish instantly.

**Acceptance Scenarios**:

1. **Given** the admin is on any admin page, **When** they click the language toggle (🇺🇸/🇪🇸), **Then** all text on the page switches to the selected language immediately.

2. **Given** the admin switches to Spanish, **When** they navigate to a different admin page, **Then** the new page also displays in Spanish (language preference persists within the session).

3. **Given** the admin is on the orders page in Spanish, **When** they view status badges, **Then** status names are translated (e.g., "new" → "nuevo", "in_progress" → "en progreso").

---

### User Story 6 - Placeholder Admin Pages (Priority: P3)

The remaining admin pages (IA Chat, Intelligence, Logistics, Grid, Dispatch) display placeholder content with a "Coming Soon" message, maintaining consistent layout and navigation.

**Why these pages**: Completes the admin navigation structure for future feature development.

**Independent Test**: Navigate to each placeholder page — verify the page renders with the correct title, description, and "Coming Soon" placeholder.

**Acceptance Scenarios**:

1. **Given** the admin navigates to any placeholder page, **When** the page loads, **Then** it shows the page title, description, and a "Coming Soon" message with an icon.

---

### Edge Cases

- What happens when the order queue is empty? The table shows "No orders found matching your filters."
- What happens when a filter returns zero results? The table shows the empty state message.
- What happens when the admin tries to access `/admin` without authentication? Redirect to login (future implementation).
- What happens when the language toggle is clicked rapidly? Only the final state is rendered (React handles this naturally).
- What happens when team data is loading? Show a loading indicator.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an admin dashboard at `/admin` showing order statistics (total, new, in-progress, urgent) and a recent orders table.
- **FR-002**: System MUST provide an order queue page at `/admin/orders` with filtering by status, priority, and search by order number/customer name/email.
- **FR-003**: System MUST display order status as color-coded badges (new=blue, confirmed=green, in_progress=yellow, on_hold=orange, completed=emerald, cancelled=red).
- **FR-004**: System MUST display order priority as color-coded badges (low=gray, normal=blue, high=orange, urgent=red).
- **FR-005**: System MUST provide a team management page at `/admin/team` showing team members with roles, status, and assigned order counts.
- **FR-006**: System MUST provide a monthly agenda page at `/admin/agenda` with activities sorted by time and date picker.
- **FR-007**: System MUST support i18n language switching (English/Spanish) across all admin pages via a flag toggle component.
- **FR-008**: System MUST persist language selection within the session (no page reload required).
- **FR-009**: System MUST translate all status names, priority names, navigation labels, page titles, and placeholder text.
- **FR-010**: System MUST provide placeholder pages for IA Chat, Intelligence, Logistics, Grid, and Dispatch with "Coming Soon" content.
- **FR-011**: System MUST use a collapsible sidebar navigation with icons and labels for all admin sections.
- **FR-012**: System MUST show a top header bar with the "Concierge Elite" title and user avatar.

### Key Entities *(include if feature involves data)*

- **Order**: Customer booking with order number, booking reference, customer info, package details, flight info, destination, status, priority, assignment, payment status, notes, and timestamps.
- **User**: Admin/team member with email, name, password hash, avatar, phone, status, roles, and last login.
- **Role**: Named permission group (admin, manager, concierge, viewer) with description.
- **Permission**: Granular access control entry with resource and action (e.g., orders.view, users.create).
- **OrderStatusHistory**: Audit trail for order status changes with old/new status, changed_by user, and notes.
- **OrderComment**: Internal or customer-facing comments on orders.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin dashboard loads and displays all stat cards within 2 seconds.
- **SC-002**: Order queue filtering (status + priority + search) returns results in under 1 second.
- **SC-003**: Language toggle switches all visible text on any admin page in under 500ms.
- **SC-004**: All 9 admin pages render without errors and maintain consistent layout.
- **SC-005**: Order table displays 100% of required fields (order number, customer, package, status, priority, payment, actions).
- **SC-006**: Status and priority badges use consistent color coding across all pages.
- **SC-007**: Sidebar navigation correctly highlights the active page.
- **SC-008**: Placeholder pages display correct title, description, and "Coming Soon" message.

## Assumptions

- Admin authentication is not yet implemented — all admin pages are publicly accessible during development.
- Order data is currently mocked on the client side — will be connected to the Turso database in a future iteration.
- Team member data is mocked — real user management will be implemented with the authentication system.
- The i18n system uses React Context (same as booking page) — each admin page wraps with its own `I18nProvider`.
- Admin translations are stored in `lib/i18n/locales/en.ts` and `es.ts` under an `admin` namespace.
- The existing design system (Slate Navy, Mountain Emerald, Cool Slate) applies to admin pages.
- Admin pages are responsive but optimized for desktop (1024px+).
- Roles and permissions are seeded in the database but not yet enforced in the UI — all admin pages are accessible to all roles.
