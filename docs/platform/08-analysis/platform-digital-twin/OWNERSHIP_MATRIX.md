# OWNERSHIP_MATRIX (Real — Digital Twin)

> Feature → the module/file that **really owns it today**. Source of truth for "who is
> responsible for what" in the current system. No code changes. Derived from `MODULES/*.md`.

| Feature (real) | Owner today (real file/module) | Notes |
|---|---|---|
| Create Booking | `app/api/booking/route.ts` + `lib/services/booking-service.ts` | logic embedded in route + service |
| Validate flight / 15-day rule | `app/api/flights/validate/route.ts` | booking concern, separate route |
| Search bookings | `app/api/bookings/search/route.ts` | |
| Assign driver to reservation | `app/api/admin/reservations/[id]/assign-driver/route.ts` + `lib/dispatch` | |
| Accept / decline service | `app/api/assignments/[id]/accept` , `decline` + `lib/dispatch` | |
| Driver availability | `lib/dispatch/availability.ts` + `app/admin/dispatch` | single source today (good) |
| Create assignment | `app/api/admin/dispatch/route.ts` + `lib/dispatch` | |
| Driver onboarding / documents | `app/api/admin/drivers/*` + `lib/admin/auth` | |
| Driver ranking / performance | `app/api/admin/drivers/[id]/{ranking,performance,history}` | logic in route |
| Pricing / quote | `lib/pricing.ts` | single source (good) |
| Promotion validate | `app/api/promotions/validate` + `lib/pricing.ts` | |
| Payment create / confirm | `lib/services/payment-service.ts` + `lib/paddle.ts` + `app/api/payments/*` | |
| Payment split | `lib/paddle.ts` (split cols on `orders_new`) + `app/api/admin/payments/splits` | |
| Refund | `app/api/admin/payments/refund` + `lib/paddle.ts` | |
| WhatsApp notify (outbound) | `lib/services/whatsapp-service.ts` + `lib/n8n/client.ts` | also enqueues `outgoing_messages` |
| WhatsApp inbound | `app/api/webhooks/evolution/route.ts` → `lib/queue` | |
| Chat session | `lib/services/chat-service.ts` + `app/api/chat/*` | |
| AI reply / escalate | `lib/services/ollama-service.ts` + `app/api/chat/ai-response`, `escalate` | |
| Ratings submit | `lib/services/rating-service.ts` + `app/api/ratings` | |
| Moderate comment | `lib/moderation/comment-filter.ts` | used by chat/ratings |
| Case management | `app/api/admin/cases/*` | |
| Hotel / room / promo CRUD | `app/api/admin/hotels`, `rooms`, `promotions` + `lib/admin/hotel-auth` | |
| Public hotel lookup | `app/api/hotels`, `app/api/promotions/validate` | |
| Geocode | `app/api/geocode/route.ts` | maps |
| RBAC / permissions | `lib/admin/permissions.ts` | single source (good) |
| Team / employees / roles | `app/api/admin/team`, `employees`, `roles`, `modules` + `lib/admin/auth` | |
| Clerk sync | `app/api/webhooks/clerk/route.ts` | |
| Settings / config | `app/api/admin/settings` + `lib/config.ts` | env vs DB settings (two sources — see SoT) |
| Analytics | `app/api/admin/analytics` + `app/admin/analytics` | read models |

## Observations
- Several features are **owned by a route handler**, not a domain — the core 2C extraction.
- A few are already single-sourced correctly (availability, pricing, permissions) — preserve
  these during migration (they match `SOURCE_OF_TRUTH_MATRIX.md`).
- "Settings/config" has **two** real owners (env `lib/config.ts` and DB `settings` table) — a
  duplication risk to resolve (see `SOURCE_OF_TRUTH_MATRIX.md`).
