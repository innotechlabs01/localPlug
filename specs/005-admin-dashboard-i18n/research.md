# Research: Admin Dashboard with Order Queue & i18n

## 1. Admin Dashboard Architecture

**Decision**: Single-page admin layout with collapsible sidebar navigation

**Rationale**: The admin dashboard requires consistent navigation across 9 pages. A shared layout component provides the sidebar, header, and main content area. Client components are used for interactive pages (orders filtering, team management).

**Alternatives considered**:
- **Multi-page without shared layout**: Rejected — inconsistent navigation
- **iframe-based dashboard**: Rejected — poor UX, no shared state
- **React Portal-based**: Rejected — unnecessary complexity

## 2. Order Queue Data Flow

**Decision**: Mock data on client side with Turso as persistent store

**Rationale**: The order queue currently uses client-side mock data for rapid prototyping. The Turso database has the `orders` table ready for integration. The transition from mock to real data will be a single API endpoint change.

**Alternatives considered**:
- **Direct Turso queries from client**: Rejected — exposes database credentials
- **Server Actions**: Considered for future — good Next.js pattern
- **API Routes**: Selected — standard REST pattern, easy to test

## 3. i18n Implementation Pattern

**Decision**: React Context with locale files (same as booking page)

**Rationale**: The booking page already implements i18n with `I18nProvider` and `useI18n()` hook. Admin pages follow the same pattern for consistency. Each admin page wraps with its own `I18nProvider` to avoid prop drilling.

**Alternatives considered**:
- **next-intl**: More feature-rich but adds dependency — overkill for current scope
- **URL-based routing**: `/admin/en/orders` — adds complexity, not needed for admin
- **Browser language detection**: Good default but manual toggle still needed

## 4. RBAC Implementation

**Decision**: Database-seeded roles/permissions, not yet enforced in UI

**Rationale**: The roles and permissions tables are created and seeded with 4 roles and 17 permissions. However, enforcing them in the UI requires authentication first. The plan is to implement auth, then add permission checks to each page.

**Alternatives considered**:
- **Client-side permission checks**: Easy but not secure — can be bypassed
- **Server-side middleware**: Best practice — implement after auth
- **API-level enforcement**: Required for production — separate task

## 5. Status Badge Color System

**Decision**: Consistent color coding across all admin pages

**Rationale**: Status and priority badges use the same color scheme everywhere:
- Status: new=blue, confirmed=green, in_progress=yellow, on_hold=orange, completed=emerald, cancelled=red
- Priority: low=gray, normal=blue, high=orange, urgent=red

This consistency helps the team quickly identify order states.

## 6. Admin Page Responsiveness

**Decision**: Desktop-first (1024px+), responsive down to tablet

**Rationale**: Admin dashboards are primarily used on desktop/laptop screens. The sidebar collapses on smaller screens. Mobile support is secondary — the concierge team uses desktop for operations.

**Alternatives considered**:
- **Mobile-first**: Not needed for admin tools
- **Fixed sidebar**: Better for desktop but wastes mobile space
