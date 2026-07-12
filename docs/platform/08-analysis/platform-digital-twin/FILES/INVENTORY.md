# FILES — Real Source Inventory (Digital Twin)

> **Machine-generated enumeration of the current monolith.** Every file below exists today.
> Per-file **real responsibilities** live in `MODULES/<DOMAIN>.md` (this index links each file to its domain doc).
> Regenerate with the same walker used by `DEPENDENCIES/scan-deps.mjs`.

**Total real source files: 220**

## BOOKING (49 files)
See `MODULES/BOOKING.md`

| # | File |
|---|---|
| 1 | `app/admin/orders/page.tsx` |
| 2 | `app/admin/reservations/components/ReservationDetailModal.tsx` |
| 3 | `app/admin/reservations/components/ReservationFilters.tsx` |
| 4 | `app/admin/reservations/components/ReservationKPIs.tsx` |
| 5 | `app/admin/reservations/components/ReservationTable.tsx` |
| 6 | `app/admin/reservations/components/ReservationTimeline.tsx` |
| 7 | `app/admin/reservations/page.tsx` |
| 8 | `app/api/admin/orders/[id]/route.ts` |
| 9 | `app/api/admin/orders/[id]/status/route.ts` |
| 10 | `app/api/admin/orders/route.ts` |
| 11 | `app/api/admin/reservations/[id]/assign-driver/route.ts` |
| 12 | `app/api/admin/reservations/route.ts` |
| 13 | `app/api/booking/route.ts` |
| 14 | `app/api/bookings/delivery-completed/route.ts` |
| 15 | `app/api/bookings/driver-assigned/route.ts` |
| 16 | `app/api/bookings/search/route.ts` |
| 17 | `app/api/flights/validate/route.ts` |
| 18 | `app/booking/confirmation/page.tsx` |
| 19 | `app/booking/page.tsx` |
| 20 | `app/components/booking/__tests__/booking-form.test.tsx` |
| 21 | `app/components/booking/__tests__/booking-store.test.ts` |
| 22 | `app/components/booking/__tests__/date-enforcement.test.ts` |
| 23 | `app/components/booking/__tests__/flight-validation.test.ts` |
| 24 | `app/components/booking/__tests__/persistence.test.ts` |
| 25 | `app/components/booking/__tests__/toast.test.tsx` |
| 26 | `app/components/booking/booking-confirmation.tsx` |
| 27 | `app/components/booking/booking-form.tsx` |
| 28 | `app/components/booking/booking-summary.tsx` |
| 29 | `app/components/booking/lib/booking-store.ts` |
| 30 | `app/components/booking/lib/country-dial-codes.ts` |
| 31 | `app/components/booking/lib/error-boundary.tsx` |
| 32 | `app/components/booking/lib/flight-validation.ts` |
| 33 | `app/components/booking/lib/logger.ts` |
| 34 | `app/components/booking/lib/payment-store.ts` |
| 35 | `app/components/booking/lib/persistence.ts` |
| 36 | `app/components/booking/lib/phone-validation.ts` |
| 37 | `app/components/booking/lib/toast.tsx` |
| 38 | `app/components/booking/lib/types.ts` |
| 39 | `app/components/booking/phone-input-with-country.tsx` |
| 40 | `app/components/booking/step-destination.tsx` |
| 41 | `app/components/booking/step-flight-logistics.tsx` |
| 42 | `app/components/booking/step-packages.tsx` |
| 43 | `app/components/booking/step-payment.tsx` |
| 44 | `app/components/booking/step-progress.tsx` |
| 45 | `app/components/booking/step-traveler-profile.tsx` |
| 46 | `lib/reservations-api.ts` |
| 47 | `lib/reservations-types.ts` |
| 48 | `lib/services/booking-service.ts` |
| 49 | `lib/trm.ts` |

## DISPATCH (6 files)
See `MODULES/DISPATCH.md`

| # | File |
|---|---|
| 1 | `app/admin/dispatch/page.tsx` |
| 2 | `app/admin/dispatch/use-polling.ts` |
| 3 | `app/api/admin/dispatch/route.ts` |
| 4 | `app/api/assignments/[id]/accept/route.ts` |
| 5 | `app/api/assignments/[id]/decline/route.ts` |
| 6 | `app/api/assignments/route.ts` |

## DRIVERS (8 files)
See `MODULES/DRIVERS.md`

| # | File |
|---|---|
| 1 | `app/admin/drivers/page.tsx` |
| 2 | `app/admin/fleet/page.tsx` |
| 3 | `app/api/admin/drivers/[id]/documents/route.ts` |
| 4 | `app/api/admin/drivers/[id]/history/route.ts` |
| 5 | `app/api/admin/drivers/[id]/performance/route.ts` |
| 6 | `app/api/admin/drivers/[id]/photo/route.ts` |
| 7 | `app/api/admin/drivers/ranking/route.ts` |
| 8 | `app/api/admin/drivers/route.ts` |

## CUSTOMERS (2 files)
See `MODULES/CUSTOMERS.md`

| # | File |
|---|---|
| 1 | `app/admin/customers/page.tsx` |
| 2 | `app/api/admin/customers/route.ts` |

## PAYMENTS (11 files)
See `MODULES/PAYMENTS.md`

| # | File |
|---|---|
| 1 | `app/admin/payments/page.tsx` |
| 2 | `app/api/admin/payments/refund/route.ts` |
| 3 | `app/api/admin/payments/route.ts` |
| 4 | `app/api/admin/payments/splits/route.ts` |
| 5 | `app/api/payments/confirm/route.ts` |
| 6 | `app/api/payments/create-intent/route.ts` |
| 7 | `app/api/payments/status/route.ts` |
| 8 | `app/api/webhooks/paddle/route.ts` |
| 9 | `lib/paddle/server.ts` |
| 10 | `lib/payment-record.ts` |
| 11 | `lib/services/payment-service.ts` |

## NOTIFICATIONS (9 files)
See `MODULES/NOTIFICATIONS.md`

| # | File |
|---|---|
| 1 | `app/api/admin/queue/route.ts` |
| 2 | `app/api/cron/process-queue/route.ts` |
| 3 | `app/api/webhooks/evolution/route.ts` |
| 4 | `app/api/webhooks/n8n/route.ts` |
| 5 | `lib/n8n/client.ts` |
| 6 | `lib/queue/message-queue.ts` |
| 7 | `lib/queue/whatsapp-worker.ts` |
| 8 | `lib/services/whatsapp-service.ts` |
| 9 | `lib/whatsapp-event.ts` |

## CHAT (17 files)
See `MODULES/CHAT.md`

| # | File |
|---|---|
| 1 | `app/api/chat/agent-me/route.ts` |
| 2 | `app/api/chat/agents/available/route.ts` |
| 3 | `app/api/chat/agents/route.ts` |
| 4 | `app/api/chat/ai-response/route.ts` |
| 5 | `app/api/chat/close/route.ts` |
| 6 | `app/api/chat/conversations/route.ts` |
| 7 | `app/api/chat/escalate/route.ts` |
| 8 | `app/api/chat/messages/route.ts` |
| 9 | `app/api/chat/request-escalate/route.ts` |
| 10 | `app/api/chat/send/route.ts` |
| 11 | `app/api/chat/start/route.ts` |
| 12 | `app/components/chat/ChatWidget.tsx` |
| 13 | `app/components/chat/__tests__/ChatWidget.test.tsx` |
| 14 | `app/components/chat/__tests__/chat-service.test.ts` |
| 15 | `app/components/chat/__tests__/comment-filter.test.ts` |
| 16 | `app/components/chat/__tests__/ollama-service.test.ts` |
| 17 | `lib/services/chat-service.ts` |

## AI (1 files)
See `MODULES/AI.md`

| # | File |
|---|---|
| 1 | `lib/services/ollama-service.ts` |

## REALTIME (2 files)
See `MODULES/REALTIME.md`

| # | File |
|---|---|
| 1 | `app/api/admin/realtime/route.ts` |
| 2 | `lib/admin/realtime-context.tsx` |

## AUTH (14 files)
See `MODULES/AUTH.md`

| # | File |
|---|---|
| 1 | `app/admin/employees/page.tsx` |
| 2 | `app/admin/roles/page.tsx` |
| 3 | `app/admin/team/page.tsx` |
| 4 | `app/api/admin/employees/route.ts` |
| 5 | `app/api/admin/modules/route.ts` |
| 6 | `app/api/admin/permissions/mine/route.ts` |
| 7 | `app/api/admin/permissions/route.ts` |
| 8 | `app/api/admin/team/roles/route.ts` |
| 9 | `app/api/admin/team/route.ts` |
| 10 | `app/api/webhooks/clerk/route.ts` |
| 11 | `lib/admin/auth.ts` |
| 12 | `lib/admin/permissions.ts` |
| 13 | `lib/webhook-auth.ts` |
| 14 | `middleware.ts` |

## HOTELS (10 files)
See `MODULES/HOTELS.md`

| # | File |
|---|---|
| 1 | `app/admin/hotels/page.tsx` |
| 2 | `app/admin/promotions/page.tsx` |
| 3 | `app/api/admin/hotels/route.ts` |
| 4 | `app/api/admin/hotels/stats/route.ts` |
| 5 | `app/api/admin/promotions/route.ts` |
| 6 | `app/api/admin/rooms/route.ts` |
| 7 | `app/api/admin/users/hotel-assign/route.ts` |
| 8 | `app/api/hotels/route.ts` |
| 9 | `app/api/promotions/validate/route.ts` |
| 10 | `lib/admin/hotel-auth.ts` |

## RATINGS (9 files)
See `MODULES/RATINGS.md`

| # | File |
|---|---|
| 1 | `app/api/chat/rating/route.ts` |
| 2 | `app/api/ratings/route.ts` |
| 3 | `app/api/ratings/stats/route.ts` |
| 4 | `app/components/ratings/RatingCard.tsx` |
| 5 | `app/components/ratings/RatingForm.tsx` |
| 6 | `app/components/ratings/RatingStats.tsx` |
| 7 | `app/components/ratings/RatingsProvider.tsx` |
| 8 | `app/components/ratings/TestimonialsSlider.tsx` |
| 9 | `lib/services/rating-service.ts` |

## CASES (5 files)
See `MODULES/CASES.md`

| # | File |
|---|---|
| 1 | `app/admin/cases/[id]/page.tsx` |
| 2 | `app/api/admin/cases/documents/route.ts` |
| 3 | `app/api/admin/cases/events/route.ts` |
| 4 | `app/api/admin/cases/route.ts` |
| 5 | `app/api/admin/cases/tasks/route.ts` |

## MAPS (3 files)
See `MODULES/MAPS.md`

| # | File |
|---|---|
| 1 | `app/api/geocode/route.ts` |
| 2 | `app/components/ui/leaflet-map.tsx` |
| 3 | `app/sitemap.ts` |

## MODERATION (1 files)
See `MODULES/MODERATION.md`

| # | File |
|---|---|
| 1 | `lib/moderation/comment-filter.ts` |
## DATABASE (3 files)

See `DATABASE/DATABASE.md`

| # | File |
|---|---|
| 1 | `lib/db.ts` |
| 2 | `lib/db/migrate-auto.ts` |
| 3 | `scripts/migrate.ts` |

## CONFIG_SHARED (4 files)
See `MODULES/CONFIG_SHARED.md`

| # | File |
|---|---|
| 1 | `app/api/config/route.ts` |
| 2 | `app/components/pricing/pricing-section.tsx` |
| 3 | `lib/config.ts` |
| 4 | `lib/pricing.ts` |

## UI (30 files)
See `MODULES/UI.md`

| # | File |
|---|---|
| 1 | `app/admin/agenda/page.tsx` |
| 2 | `app/admin/analytics/page.tsx` |
| 3 | `app/admin/grid/page.tsx` |
| 4 | `app/admin/ia-chat/page.tsx` |
| 5 | `app/admin/intelligence/page.tsx` |
| 6 | `app/admin/inventory/page.tsx` |
| 7 | `app/admin/layout.tsx` |
| 8 | `app/admin/logistics/page.tsx` |
| 9 | `app/admin/page.tsx` |
| 10 | `app/admin/settings/page.tsx` |
| 11 | `app/admin/support/page.tsx` |
| 12 | `app/components/about/about-section.tsx` |
| 13 | `app/components/admin/InactivityGuard.tsx` |
| 14 | `app/components/concierge/concierge-card.tsx` |
| 15 | `app/components/concierge/concierge-section.tsx` |
| 16 | `app/components/cta/cta-section.tsx` |
| 17 | `app/components/experiences/experiences-section.tsx` |
| 18 | `app/components/hero/hero-cta.tsx` |
| 19 | `app/components/hero/hero-section.tsx` |
| 20 | `app/components/how-it-works/how-it-works-section.tsx` |
| 21 | `app/components/how-it-works/step-card.tsx` |
| 22 | `app/components/layout/footer.tsx` |
| 23 | `app/components/layout/header.tsx` |
| 24 | `app/components/stats/stats-bar.tsx` |
| 25 | `app/components/testimonials/testimonials-section.tsx` |
| 26 | `app/components/ui/button.tsx` |
| 27 | `app/components/ui/input.tsx` |
| 28 | `app/components/ui/lang-toggle.tsx` |
| 29 | `app/hooks/use-count-up.ts` |
| 30 | `app/hooks/use-scroll-reveal.ts` |
## SHARED_OTHER (36 files)

See `MODULES/CONFIG_SHARED.md`

| # | File |
|---|---|
| 1 | `app/api/admin/agenda/route.ts` |
| 2 | `app/api/admin/analytics/route.ts` |
| 3 | `app/api/admin/lookup/route.ts` |
| 4 | `app/api/admin/settings/route.ts` |
| 5 | `app/api/admin/stats/route.ts` |
| 6 | `app/api/health/route.ts` |
| 7 | `app/error.tsx` |
| 8 | `app/layout.tsx` |
| 9 | `app/loading.tsx` |
| 10 | `app/not-found.tsx` |
| 11 | `app/opengraph-image.tsx` |
| 12 | `app/page.tsx` |
| 13 | `app/reset-password/page.tsx` |
| 14 | `app/robots.ts` |
| 15 | `app/sign-in/[[...sign-in]]/page.tsx` |
| 16 | `lib/admin/admin-fetch.ts` |
| 17 | `lib/admin/date-filter-context.tsx` |
| 18 | `lib/admin/toast-context.tsx` |
| 19 | `lib/conversation.ts` |
| 20 | `lib/countries.ts` |
| 21 | `lib/date-utils.ts` |
| 22 | `lib/design-tokens.ts` |
| 23 | `lib/dispatch/availability.ts` |
| 24 | `lib/i18n/index.tsx` |
| 25 | `lib/i18n/locales/en.ts` |
| 26 | `lib/i18n/locales/es.ts` |
| 27 | `lib/i18n/server.ts` |
| 28 | `lib/language-utils.ts` |
| 29 | `lib/logger.ts` |
| 30 | `lib/message.ts` |
| 31 | `lib/phone-utils.ts` |
| 32 | `lib/rate-limit.ts` |
| 33 | `lib/resilience/circuit-breaker.ts` |
| 34 | `lib/services/agent-service.ts` |
| 35 | `lib/string-utils.ts` |
| 36 | `scripts/setup-admin.ts` |

