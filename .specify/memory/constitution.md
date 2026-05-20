<!--
  Sync Impact Report
  ==================
  Version change: 1.0.0 → 1.1.0
  Modified principles:
    - Project title: "Premium Andean Hospitality — Landing Page Constitution" → "Premium Andean Hospitality Constitution"
    - I. Next.js & React Best Practices (no change)
    - II. SEO-First Development (no change)
    - III. Performance & Core Web Vitals (no change)
    - IV. Design System Compliance (no change)
    - V. TypeScript Strictness & Code Quality (no change)
    - VI. Accessibility (WCAG) (no change)
    - VII. Testing & Validation (expanded: added chat/API testing)
    - VIII. Admin Dashboard & Customer Support (NEW)
    - IX. Real-Time Communication (NEW)
    - Technology Stack & Deployment (updated: added Turso, Stripe, n8n)
    - Development Workflow (updated: branch format change)
    - Governance (no change)
  Added sections:
    - VIII. Admin Dashboard & Customer Support
    - IX. Real-Time Communication
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (constitution check gate references updated)
    - .specify/templates/spec-template.md ✅ (no changes needed)
    - .specify/templates/tasks-template.md ✅ (no changes needed)
    - .specify/templates/checklist-template.md ✅ (no changes needed)
  Follow-up TODOs: None
-->

# Premium Andean Hospitality Constitution

## Core Principles

### I. Next.js & React Best Practices

Every page MUST use the Next.js App Router (`app/` directory) with React Server Components (RSC) by default. Client components (`'use client'`) MUST only be used when interactivity, browser APIs, or lifecycle hooks are required. All data fetching MUST prefer server-side patterns (`async` component, `fetch` with caching) over client-side fetching. Route segments MUST follow the standard Next.js file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`).

### II. SEO-First Development

Every page MUST export a `metadata` object or `generateMetadata` function with `title`, `description`, and `openGraph`. Structured data (JSON-LD) MUST be included for key content types (Organization, LocalBusiness, Product). A dynamic `sitemap.ts` MUST be maintained. Canonical URLs MUST be set on every page. Images MUST have descriptive `alt` attributes. Meta tags MUST include `viewport`, `robots`, and `theme-color`.

### III. Performance & Core Web Vitals

Pages MUST target Lighthouse scores of 90+ on all metrics (Performance, Accessibility, Best Practices, SEO). Largest Contentful Paint (LCP) MUST be under 2.5s. Cumulative Layout Shift (CLS) MUST be under 0.1. Interaction to Next Paint (INP) MUST be under 200ms. Images MUST use `next/image` with explicit `width`, `height`, and `priority` for above-the-fold assets. Fonts MUST be self-hosted or preloaded with `next/font`. Unnecessary JavaScript MUST be deferred or tree-shaken.

### IV. Design System Compliance

All UI MUST follow the Premium Andean Hospitality design tokens exactly: Slate Navy (`#0F172A`) for primary elements and headings, Mountain Emerald (`#059669`) for secondary/success actions, Golden Sol (`#F59E0B`) for highlights and ratings, Clean White (`#FFFFFF`) and Cool Slate 50 (`#F8FAFC`) for backgrounds. Typography MUST use Plus Jakarta Sans for headlines and Inter for body text. All colors, spacing (8px base unit), corner radii (8px default, 16px for large containers) and shadows MUST match the design token specification. No sharp 0px corners.

### V. TypeScript Strictness & Code Quality

All source code MUST be TypeScript with `strict: true` in `tsconfig.json`. Explicit types MUST be used for all props, function parameters, and return types. `any` is forbidden — use `unknown` with type guards instead. ESLint and Prettier MUST be configured and run before every commit. No `console.log` in committed code (use proper logging).

### VI. Accessibility (WCAG)

All pages MUST use semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`). Interactive elements MUST be keyboard-accessible. Color contrast MUST meet WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text). Focus indicators MUST be visible. ARIA labels MUST be provided where native semantics are insufficient. Admin dashboard interfaces MUST also follow these standards.

### VII. Testing & Validation

A Lighthouse CI check MUST pass before deployment. Component-level testing (Vitest + React Testing Library) MUST cover critical interactive components across both landing pages and admin interfaces. Responsive design MUST be verified at 3 breakpoints: mobile (390px), tablet (768px), desktop (1280px). API route handlers MUST include request validation and error response tests for all non-trivial endpoints (chat, payments, admin). No broken links or 404s allowed.

### VIII. Admin Dashboard & Customer Support

The admin dashboard MUST provide a unified interface for order management, team coordination, and customer communication. The chat/support system MUST support multi-channel conversations (web widget, API), AI-assisted responses with human escalation, agent assignment balancing, conversation history, and fraud detection. All customer support interactions MUST be stored in the database with full conversation history, agent attribution, and timestamps. Admin pages MUST use a consistent sidebar layout with collapsible navigation.

### IX. Real-Time Communication

Customer-facing chat MUST be available on all pages via a floating widget. Messages MUST be delivered with low latency using polling or WebSocket/SSE. AI responses MUST be generated within 10 seconds of user input. Escalation to human agents MUST update conversation status immediately. The system MUST handle concurrent conversations efficiently with agent load balancing. Fraud patterns and blocked topics MUST be checked on every message.

## Technology Stack & Deployment

**Framework**: Next.js 16+ with App Router

**Styling**: Tailwind CSS v3+ with custom design token configuration

**Language**: TypeScript (strict mode)

**Database**: Turso (libSQL) with raw SQL migrations

**Payments**: Stripe (Payment Intents, Webhooks, Elements)

**AI/Workflow**: n8n workflow automation for AI chat, payment confirmations, fraud alerts

**Deployment**: Vercel (default branch auto-deploys)

**Package Manager**: pnpm

**Linting**: ESLint with `next/core-web-vitals` config + Prettier

**Testing**: Vitest + React Testing Library + Playwright (E2E)

**Analytics**: Vercel Analytics for performance monitoring

**i18n**: Custom React Context-based system with English/Spanish locales and localStorage persistence

## Development Workflow

All work MUST follow the structured specification-driven flow: user prompt → spec → plan → tasks → implement → checklist → analyze. Feature branches MUST follow the format `###-feature-name`.

Commit messages MUST follow conventional commits format (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`). Every PR MUST include a preview deployment link. Code review is required before merging to the default branch.

## Governance

This constitution supersedes all other development practices. Amendments require documentation of the change rationale, team approval, and a migration plan for any affected code. Violations of Core Principles MUST be justified in the Complexity Tracking section of the implementation plan.

Constitution compliance MUST be verified during the planning phase (Constitution Check gate in plan-template.md) and before deployment.

**Version**: 1.1.0 | **Ratified**: 2026-05-15 | **Last Amended**: 2026-05-16
