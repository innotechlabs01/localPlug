# Sentinel Security Journal

## 2026-11-07 - Webhook Bearer Token Authentication Gap
**Vulnerability:** External webhook receivers (`/api/webhooks/evolution` and `/api/webhooks/n8n`) handled unauthenticated HTTP POST requests, enabling arbitrary external callers to forge WhatsApp messages, spoof payment confirmations, trigger fake agent escalations, and manipulate conversations/messages in the database.
**Learning:** While third-party payment webhooks (Stripe) used cryptographic HMAC signature verification, custom inter-service integration webhooks (Evolution API and n8n) omitted authentication checks despite having pre-configured API keys in `.env` and specification requirements.
**Prevention:** Enforce Bearer token authorization with constant-time comparison (`crypto.timingSafeEqual`) on all incoming webhook routes whenever API key secrets are provisioned.

## 2026-11-07 - Unprotected Admin and Operations Endpoints
**Vulnerability:** The admin portal (`/admin/*`) and admin data endpoints (`/api/admin/*`, `/api/bookings/driver-assigned`, `/api/bookings/delivery-completed`) relied only on client-side hardcoded credentials at `/sign-in` without establishing server-side session cookies or checking authentication headers, allowing unauthenticated internet users to browse the dashboard and read or trigger administrative/logistical actions.
**Learning:** Next.js client-side route redirects do not secure underlying server components or API routes. Authorization must be enforced at the Edge/Server boundary with a root Next.js middleware and cryptographically signed HttpOnly cookies or Bearer tokens.
**Prevention:** Use `middleware.ts` to enforce session validation on all sensitive route trees (`/admin/:path*`, `/api/admin/:path*`), redirecting browser requests and returning 401 Unauthorized for API callers.
