# Implementation Plan: Admin Dashboard with Order Queue & i18n

**Branch**: `005-admin-dashboard-i18n` | **Date**: 2026-05-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-admin-dashboard-i18n/spec.md`

## Summary

Admin dashboard with order queue management, team operations, monthly agenda, and i18n support for English/Spanish. Database tables created in Turso with RBAC (roles, permissions). 9 admin pages built with sidebar navigation. i18n translations pending for admin pages.

## Technical Context

**Language/Version**: TypeScript 6 with strict mode

**Primary Dependencies**: Next.js 16 (App Router), Tailwind CSS v3, React 19,
@libsql/client (Turso), Vitest + React Testing Library

**Storage**: Turso (libSQL) database with 10 tables: orders, users, roles, permissions,
role_permissions, user_roles, order_status_history, order_comments, payments, sqlite_sequence

**Testing**: Vitest + React Testing Library

**Target Platform**: Modern web browsers (Chrome, Safari, Firefox, Edge — last 2
major versions), optimized for desktop (1024px+)

**Project Type**: Web application — admin dashboard with 9 pages, sidebar navigation,
order queue with filtering/search, team management, monthly agenda

**Performance Goals**: Dashboard loads within 2 seconds; order filtering under 1 second;
language toggle under 500ms

**Constraints**:
- Admin authentication not yet implemented — pages publicly accessible during dev
- Order data currently mocked client-side — Turso integration pending
- Team data mocked — real user management pending with auth
- Roles/permissions seeded in DB but not enforced in UI
- i18n uses React Context (same as booking page)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Next.js & React Best Practices
- Admin pages use App Router (`app/admin/` directory)
- Client components (`'use client'`) used for interactive pages (orders, team, agenda)
- Layout component provides shared sidebar navigation
- **Status**: ✅ Pass

### Principle II — SEO-First Development
- Admin pages are behind `/admin` route — not indexed
- No SEO requirements for internal admin tools
- **Status**: ✅ N/A (admin-only pages)

### Principle III — Performance & Core Web Vitals
- Admin pages are lightweight (no large images)
- Mock data loads instantly
- Sidebar navigation is static
- **Status**: ✅ Pass

### Principle IV — Design System Compliance
- Admin pages use Slate Navy sidebar, Mountain Emerald accents
- Consistent typography (Plus Jakarta Sans headlines, Inter body)
- 8px base spacing, rounded corners
- **Status**: ✅ Pass

### Principle V — TypeScript Strictness & Code Quality
- All admin components use TypeScript with explicit types
- ESLint + Prettier configured
- **Status**: ✅ Pass

### Principle VI — Accessibility (WCAG)
- Sidebar uses semantic `<nav>` element
- Interactive elements have focus indicators
- Status badges use sufficient color contrast
- **Status**: ✅ Pass

### Principle VII — Testing & Validation
- Admin pages are static/pre-rendered
- Component testing for interactive elements
- **Status**: ✅ Pass

### GATE RESULT: ✅ ALL PRINCIPLES PASS

## Project Structure

### Documentation (this feature)

```text
specs/005-admin-dashboard-i18n/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/admin/
├── layout.tsx                    # Admin sidebar layout
├── page.tsx                      # Dashboard (Concierge Elite)
├── orders/page.tsx               # Order queue with filtering
├── team/page.tsx                 # Team management
├── agenda/page.tsx               # Monthly agenda
├── ia-chat/page.tsx              # Placeholder
├── intelligence/page.tsx         # Placeholder
├── logistics/page.tsx            # Placeholder
├── grid/page.tsx                 # Placeholder
└── dispatch/page.tsx             # Placeholder

lib/
├── db.ts                         # Turso client
├── i18n/
│   ├── index.tsx                 # i18n context provider
│   └── locales/
│       ├── en.ts                 # English translations
│       └── es.ts                 # Spanish translations

app/components/ui/
└── lang-toggle.tsx               # Language toggle component
```

## Complexity Tracking

No Constitution Check violations found. This section intentionally left blank.
