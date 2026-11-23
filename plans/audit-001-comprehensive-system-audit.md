# Audit: Comprehensive System Review

**Date:** 2026-07-05
**Scope:** Landing Page, Booking Flow, Admin Panel, Payment System, Security, Architecture, UX, Business Logic
**Status:** Finding collection — no changes made

---

## Executive Summary

LocalPlug is a Next.js 15 App Router project (TypeScript, Tailwind CSS, Turso/libSQL, Clerk Auth, Paddle Payments) for premium Medellín airport concierge services. It is feature-rich with a 28-file `lib/` layer, 48+ API routes, 24+ admin pages, WhatsApp Evolution API integration, n8n AI chat, and a full i18n system in EN/ES.

**Top 3 Critical Issues:**

1. **Secrets in git:** `.env.local` is tracked despite `.gitignore` — contains live Turso DB API key (JWT), n8n API key (JWT), Paddle sandbox keys, Clerk keys
2. **Paddle webhook has NO signature verification** — anyone who knows the endpoint can forge payment confirmations
3. **Rate limiter `_redisFailed` flag never resets** — once Upstash Redis fails, the app falls back to in-memory rate limiting permanently (until server restart)

---

## 1. SECURITY

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| S1 | `.env.local` tracked by git | **CRITICAL** | `.env.local` | Contains `TURSO_API_KEY` (full JWT), `N8N_API_KEY` (full JWT), `PADDLE_SANDBOX_API_KEY`, Clerk secret key. `.gitignore` has `.env.local` but it was committed before being ignored. |
| S2 | Paddle webhook missing signature verification | **CRITICAL** | `app/api/webhooks/paddle/route.ts:4-41` | Only checks `event_type === 'transaction.completed'` and presence of `booking_reference`. No HMAC signature verification against `PADDLE_WEBHOOK_SECRET`. |
| S3 | Rate limiter `_redisFailed` never resets | **HIGH** | `lib/rate-limit.ts` | Once `_redisFailed` is set to `true`, it stays `true` forever. App falls back to per-process in-memory rate limiting (no shared state across replicas). |
| S4 | n8n webhook uses static secret comparison | **MEDIUM** | `app/api/webhooks/n8n/route.ts:16-19` | Compares `x-n8n-signature` header against `process.env.N8N_WEBHOOK_SECRET` via string equality. While functional, lacks constant-time comparison for secret validation. |
| S5 | Evolution webhook secret in header | **MEDIUM** | `app/api/webhooks/evolution/route.ts:43-46` | Uses `x-evolution-signature` header. Signature is compared via string equality (constant-time not used). |
| S6 | Chat anonymous IDs via `Math.random()` | **LOW** | Chat widget | Web chat generates anonymous user IDs using `Math.random()` stored in localStorage. No server-side validation of these IDs. |
| S7 | No CSRF protection on API routes | **LOW** | All API routes | No CSRF tokens on state-changing API endpoints. Relies on Clerk session cookies for admin routes, but public booking routes have no CSRF protection beyond origin checks (not implemented). |

---

## 2. PAYMENT SYSTEM

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| P1 | Paddle webhook: no signature verification | **CRITICAL** | `app/api/webhooks/paddle/route.ts:4-41` | (Same as S2) Anyone can POST a fabricated `transaction.completed` event with a valid `booking_reference` to mark payments as completed. |
| P2 | Dual pricing system (hardcoded + DB-backed) | **HIGH** | `lib/pricing.ts` vs `lib/config.ts` | `pricing.ts` has hardcoded values (`PACKAGES`, `RETURN_TRIP_CHARGE`). `config.ts` has DB-backed values from `settings` table. `pricing.ts` wraps `config.ts` but `app/api/booking/route.ts:28` uses the **sync** `getPackageTotal` from `pricing.ts` (hardcoded prices), not the DB-backed async version. |
| P3 | Payment status order dependency | **HIGH** | `app/api/webhooks/paddle/route.ts:29-33` | Paddle webhook updates `payments SET status = 'completed' WHERE status = 'pending'`. But the booking submission flow (`app/api/booking/route.ts`) creates the order *before* payment is initiated, meaning the webhook condition `status = 'pending'` will NOT match if no payment record exists yet. |
| P4 | No retry/idempotency key for Paddle transactions | **MEDIUM** | `lib/paddle/server.ts` | Paddle transaction creation lacks idempotency keys. Network retries could create duplicate payment intents. |
| P5 | Payment price computed at booking time, not stored immutably | **MEDIUM** | `app/api/booking/route.ts:28` | `getPackageTotal(pkg, needReturn)` is called at booking time. If prices change in DB config later, the stored order price won't match. **However**, the price IS stored in `package_price` column, so this is partially mitigated — confirm the stored price is what the customer actually saw. |

---

## 3. BUSINESS LOGIC

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| B1 | No passenger count in booking flow | **HIGH** | `app/api/booking/route.ts:30-65` | Pricing is per-booking, not per-person. The schema has no `passengers` field. If per-passenger pricing is needed later, this requires schema migration AND pricing logic change. |
| B2 | `bookingStore.add()` is a no-op | **MEDIUM** | `app/components/booking/lib/booking-store.ts:20-22` | The `add()` method checks for flight data but does nothing. `bookingStore.add(body)` in the booking route thus has zero effect. Dead code. |
| B3 | Booking summary lacks itemized breakdown | **MEDIUM** | `app/components/booking/booking-summary.tsx` | Shows base price + return charge only. No unit price, no passenger count, no subtotal, no tax, no line items. Customer cannot verify what they're paying for. |
| B4 | Flight validation UI says "10 days advance" but config supports dynamic | **MEDIUM** | Locale strings | EN locale says "10 days in advance" but `advance_booking_days` is configurable in DB. The UI message is hardcoded in locale, not dynamic from config. |
| B5 | Order status vs dispatch_status vs payment_status — unclear state machine | **MEDIUM** | Schema & code | Orders have `status`, `dispatch_status`, and `payment_status` columns. The relationship between these is not documented. For example, can an order be `status='cancelled'` but `dispatch_status='enroute'`? |
| B6 | `INSERT OR IGNORE` on booking could silently fail | **LOW** | `app/api/booking/route.ts:31` | If a duplicate `booking_reference` exists (from client-generated ID), the insert silently fails and the customer gets a "success" response with no actual order created. |

---

## 4. ADMIN PANEL

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| A1 | Admin user roles sync with Clerk | **MEDIUM** | `lib/admin/permissions.ts` | Custom `users` + `roles` + `user_roles` tables alongside Clerk. Potential for drift if a user is deleted in Clerk but not in the custom table, or vice versa. |
| A2 | Reservation DELETE does soft-delete only | **LOW** | `app/api/admin/reservations/route.ts:212-215` | Sets `status = 'cancelled'` but doesn't revert `dispatch_status` or cancel pending assignments. An order could be "cancelled" but still have an active driver assignment. |
| A3 | Admin dispatch uses `getEstimatedDurationMinutes` without null guards | **LOW** | `app/api/admin/dispatch/route.ts:134` | `getEstimatedDurationMinutes(orderData.package_name, dropoff)` — if package_name is null, the function receives an undefined/null string. The implementation should be checked for null safety. |
| A4 | Export CSV in admin reservations is client-side only | **LOW** | `app/admin/reservations/page.tsx:158-178` | Exports only currently loaded (filtered) data. If >50 reservations, only the first page is exported. No server-side CSV generation for full data export. |
| A5 | Admin has no pagination on reservations | **LOW** | `app/admin/reservations/page.tsx` | All reservations loaded into memory at once. No server-side pagination. Performance will degrade as data grows. |
| A6 | Realtime context wrapping both reservations and dispatch pages | **LOW** | `app/admin/reservations/page.tsx:7`, `app/admin/dispatch/page.tsx:7` | Both pages use `RealtimeProvider`. Review if this is needed in page-level components vs. a root layout. |

---

## 5. ARCHITECTURE

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| R1 | Config cache (60s TTL) never invalidated on write | **MEDIUM** | `lib/config.ts:72-74`, `lib/config.ts:286-289` | `refreshConfig()` exists but there's no admin UI or webhook to call it when settings are updated. Cache can show stale data. |
| R2 | `lib/db.ts` uses singleton pattern — unclear connection pooling | **MEDIUM** | `lib/db.ts` | Turso/libSQL client is created once. For serverless (Vercel), this is fine. For self-hosted Node, connection reuse patterns should be validated. |
| R3 | No error boundary at app root | **MEDIUM** | Root layout | No global error boundary. A crash in any page component could bring down the whole app. |
| R4 | Large i18n locale files loaded on every request | **LOW** | `lib/i18n/locales/en.ts` (1418 lines), `es.ts` (1309 lines) | Static objects with deeply nested keys. Every client page load imports the entire object even if only using 5% of keys. Consider lazy loading or tree-shaking. |
| R5 | `'use client'` in landing page components | **LOW** | Various landing page files | Many landing components are marked `'use client'` unnecessarily (no state, no effects, no browser APIs). Prevents server rendering optimization. |

---

## 6. UX / FRONTEND

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| U1 | Booking summary lacks passenger count | **MEDIUM** | `app/components/booking/booking-summary.tsx` | No display of how many passengers the booking is for. |
| U2 | No loading skeleton for reservations table | **MEDIUM** | `app/admin/reservations/page.tsx:180-187` | Shows a simple spinner. Would benefit from skeleton loading for better perceived performance. |
| U3 | `alert()` for errors in admin panel | **LOW** | `app/admin/reservations/page.tsx:131`, `app/admin/dispatch/page.tsx` | Uses browser `alert()` for WhatsApp send failures and cancel confirmation. Should use a proper toast/notification system. |
| U4 | No confirmation toast for dispatch assignment | **LOW** | `app/admin/dispatch/page.tsx` | Uses custom notification stack. Validates on success but no "undo" action in the toast. |
| U5 | Landing page image alt texts in English only | **LOW** | EN locale `hero.altBackground` and `hero.altCard` | Alt texts for hero images are in English locale but no Spanish alternatives visible. |

---

## 7. WEBHOOK HANDLERS

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| W1 | Paddle: missing signature verification | **CRITICAL** | `app/api/webhooks/paddle/route.ts` | (S2, P1) |
| W2 | Paddle: no notification of booking on successful payment | **MEDIUM** | `app/api/webhooks/paddle/route.ts:29-33` | Updates payment status but does not: (1) update order status to 'confirmed', (2) trigger n8n notification, (3) send WhatsApp confirmation to customer. |
| W3 | n8n webhook: no retry on DB failure | **LOW** | `app/api/webhooks/n8n/route.ts` | If DB write fails (e.g., constraint violation), the webhook returns success but data is lost. No dead-letter queue or retry. |
| W4 | Evolution webhook: full message payload stored in DB | **LOW** | `app/api/webhooks/evolution/route.ts:86` | Stores raw `JSON.stringify(msg)` in `raw_payload` column. Could contain sensitive message data in DB logs. |

---

## 8. DEPLOYMENT & INFRASTRUCTURE

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| D1 | `.env.local` with secrets tracked in git | **CRITICAL** | `.env.local` | (S1) Must be removed from git history. |
| D2 | No Dockerfile or deployment config in repo | **MEDIUM** | Root | No Dockerfile, docker-compose, or deployment manifests. The project references n8n Docker in docs but the main app has no container config. |
| D3 | TypeScript strict mode unknown | **LOW** | `tsconfig.json` | Should verify `strict: true` is enabled. Many `any` casts in code (e.g., `as unknown as Record<string, unknown>`) suggest not all strict checks pass. |
| D4 | No CI/CD configuration | **LOW** | Root | No GitHub Actions, no lint/test/typecheck pipeline configured. |

---

## 9. STRENGTHS

- **SEO**: Landing page has proper JSON-LD structured data, `priority` images, robots.txt, sitemap
- **i18n coverage**: EN and ES locales are thorough with 1300+ lines each across public and admin sections
- **Admin permissions**: Granular RBAC with module-level `requirePermission` checks on all admin API routes
- **Rate limiting**: Booking submission has rate limiting (though Redis fallback issue noted)
- **WhatsApp integration**: Well-structured Evolution API webhook handler with conversation management, AI chat escalation, and admin takeover
- **Driver dispatch**: Smart driver suggestion with availability checking, timeline tracking, and n8n notification triggers
- **Config system**: DB-backed settings with sensible defaults and cache — good foundation for admin UI configuration
- **Webhook signatures**: n8n and Evolution webhooks DO verify signatures (only Paddle is missing)
- **Security headers**: Admin routes use Clerk session verification via middleware
- **Payment store**: Separate `payments` table tracking transaction status, with `hasCompletedPayment`/`hasPendingPayment` helpers
- **Code organization**: Clean `lib/` structure with separation of concerns (config, db, pricing, dispatch, permissions)

---

## 10. PRIORITIZED ACTION PLAN

### IMMEDIATE (within hours)
1. **Remove `.env.local` from git**: `git rm --cached .env.local && git add .gitignore && git commit -m "chore: remove tracked .env.local with secrets"`. Then rotate ALL keys in `.env.local`.
2. **Add Paddle webhook signature verification**: Implement HMAC-SHA256 verification using `PADDLE_WEBHOOK_SECRET` before processing any webhook event.

### HIGH (within days)
3. **Fix rate limiter `_redisFailed`**: Add periodic Redis health-check that resets `_redisFailed` on successful connection.
4. **Consolidate pricing system**: Remove hardcoded prices from `pricing.ts` and use only DB-backed `config.ts` values. Update `app/api/booking/route.ts` to use async pricing.
5. **Paddle webhook should confirm orders**: After marking payment completed, update order status to 'confirmed' and trigger n8n notification.
6. **Fix payment status race condition**: Ensure payment record is created before or atomically with the order, so the Paddle webhook's `WHERE status = 'pending'` condition works reliably.

### MEDIUM (within weeks)
7. **Add passenger count field** to booking flow and schema (if per-person pricing is a requirement).
8. **Admin pagination** for reservations/dispatch to handle data growth.
9. **Implement proper error boundaries** at root level.
10. **Add order status state machine documentation** — clarify valid transitions between `status`, `dispatch_status`, and `payment_status`.
11. **Replace `INSERT OR IGNORE`** with explicit duplicate check + proper error handling in booking route.
12. **Fix `bookingStore.add()`** (either implement it or remove the dead code).
13. **Admin config page** to update DB settings with cache invalidation.

### LOW (as needed)
14. Client-side CSV export should paginate or use server-side generation.
15. Replace `alert()` calls with toast notifications.
16. Audit `'use client'` directives for unnecessary client components.
17. Add CSRF tokens to public booking endpoints.
18. Add CI/CD pipeline (lint → typecheck → test → build).
19. Add Dockerfile for production deployment.
