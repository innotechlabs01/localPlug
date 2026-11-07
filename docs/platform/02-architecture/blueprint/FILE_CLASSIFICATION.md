# FILE_CLASSIFICATION

> **Epic 2A — Platform Blueprint.** Every existing source file is assigned exactly one
> classification. **No code is modified.** This table is the contract for Epic 2C
> (Platform Refactoring): each `Move/Split/Merge/Replace` becomes a refactor step;
> `Delete` is only executed after the logic has been migrated and tests pass.

**Legend:** `Keep` (no ownership change) · `Move` (relocate, no behavior change) ·
`Split` (divide contents across targets) · `Merge` (combine into existing target) ·
`Replace` (rewrite, e.g. polling→Socket.IO, libsql→Drizzle) · `Delete` (only after migration).

| # | Current file | Target (future) | Action | Epic | Note |
|---|---|---|---|---|---|
| 1 | `app/admin/agenda/page.tsx` | `apps/admin/agenda/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 2 | `app/admin/analytics/page.tsx` | `apps/admin/analytics/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 3 | `app/admin/cases/[id]/page.tsx` | `apps/admin/cases/[id]/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 4 | `app/admin/customers/page.tsx` | `apps/admin/customers/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 5 | `app/admin/dispatch/page.tsx` | `apps/admin/dispatch/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 6 | `app/admin/dispatch/use-polling.ts` | `packages/realtime` | Replace | Epic 4 | Polling → Socket.IO client |
| 7 | `app/admin/drivers/page.tsx` | `apps/admin/drivers/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 8 | `app/admin/employees/page.tsx` | `apps/admin/employees/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 9 | `app/admin/fleet/page.tsx` | `apps/admin/fleet/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 10 | `app/admin/grid/page.tsx` | `apps/admin/grid/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 11 | `app/admin/hotels/page.tsx` | `apps/admin/hotels/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 12 | `app/admin/ia-chat/page.tsx` | `apps/admin/ia-chat/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 13 | `app/admin/intelligence/page.tsx` | `apps/admin/intelligence/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 14 | `app/admin/inventory/page.tsx` | `apps/admin/inventory/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 15 | `app/admin/layout.tsx` | `apps/admin/layout.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 16 | `app/admin/logistics/page.tsx` | `apps/admin/logistics/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 17 | `app/admin/orders/page.tsx` | `apps/admin/orders/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 18 | `app/admin/page.tsx` | `apps/admin/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 19 | `app/admin/payments/page.tsx` | `apps/admin/payments/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 20 | `app/admin/promotions/page.tsx` | `apps/admin/promotions/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 21 | `app/admin/reservations/components/ReservationDetailModal.tsx` | `apps/admin/reservations/components/ReservationDetailModal.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 22 | `app/admin/reservations/components/ReservationFilters.tsx` | `apps/admin/reservations/components/ReservationFilters.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 23 | `app/admin/reservations/components/ReservationKPIs.tsx` | `apps/admin/reservations/components/ReservationKPIs.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 24 | `app/admin/reservations/components/ReservationTable.tsx` | `apps/admin/reservations/components/ReservationTable.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 25 | `app/admin/reservations/components/ReservationTimeline.tsx` | `apps/admin/reservations/components/ReservationTimeline.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 26 | `app/admin/reservations/page.tsx` | `apps/admin/reservations/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 27 | `app/admin/roles/page.tsx` | `apps/admin/roles/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 28 | `app/admin/settings/page.tsx` | `apps/admin/settings/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 29 | `app/admin/support/page.tsx` | `apps/admin/support/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 30 | `app/admin/team/page.tsx` | `apps/admin/team/page.tsx` | Move | Epic 5 | Admin UI/page; extract any embedded logic to domain |
| 31 | `app/api/admin/agenda/route.ts` | `apps/admin/app/api/admin/agenda/route.ts` | Move | Epic 5 | Route moves with admin |
| 32 | `app/api/admin/analytics/route.ts` | `apps/admin/app/api/admin/analytics/route.ts` | Split | Epic 2C/3 | Thin route orchestrates analytics domain; logic → packages/domains/analytics |
| 33 | `app/api/admin/cases/documents/route.ts` | `apps/admin/app/api/admin/cases/documents/route.ts` | Split | Epic 2C/3 | Thin route orchestrates cases domain; logic → packages/domains/cases |
| 34 | `app/api/admin/cases/events/route.ts` | `apps/admin/app/api/admin/cases/events/route.ts` | Split | Epic 2C/3 | Thin route orchestrates cases domain; logic → packages/domains/cases |
| 35 | `app/api/admin/cases/route.ts` | `apps/admin/app/api/admin/cases/route.ts` | Split | Epic 2C/3 | Thin route orchestrates cases domain; logic → packages/domains/cases |
| 36 | `app/api/admin/cases/tasks/route.ts` | `apps/admin/app/api/admin/cases/tasks/route.ts` | Split | Epic 2C/3 | Thin route orchestrates cases domain; logic → packages/domains/cases |
| 37 | `app/api/admin/customers/route.ts` | `apps/admin/app/api/admin/customers/route.ts` | Split | Epic 2C/3 | Thin route orchestrates customers domain; logic → packages/domains/customers |
| 38 | `app/api/admin/dispatch/route.ts` | `apps/admin/app/api/admin/dispatch/route.ts` | Split | Epic 2C/3 | Thin route orchestrates dispatch domain; logic → packages/domains/dispatch |
| 39 | `app/api/admin/drivers/[id]/documents/route.ts` | `apps/admin/app/api/admin/drivers/[id]/documents/route.ts` | Split | Epic 2C/3 | Thin route orchestrates drivers domain; logic → packages/domains/drivers |
| 40 | `app/api/admin/drivers/[id]/history/route.ts` | `apps/admin/app/api/admin/drivers/[id]/history/route.ts` | Split | Epic 2C/3 | Thin route orchestrates drivers domain; logic → packages/domains/drivers |
| 41 | `app/api/admin/drivers/[id]/performance/route.ts` | `apps/admin/app/api/admin/drivers/[id]/performance/route.ts` | Split | Epic 2C/3 | Thin route orchestrates drivers domain; logic → packages/domains/drivers |
| 42 | `app/api/admin/drivers/[id]/photo/route.ts` | `apps/admin/app/api/admin/drivers/[id]/photo/route.ts` | Split | Epic 2C/3 | Thin route orchestrates drivers domain; logic → packages/domains/drivers |
| 43 | `app/api/admin/drivers/ranking/route.ts` | `apps/admin/app/api/admin/drivers/ranking/route.ts` | Split | Epic 2C/3 | Thin route orchestrates drivers domain; logic → packages/domains/drivers |
| 44 | `app/api/admin/drivers/route.ts` | `apps/admin/app/api/admin/drivers/route.ts` | Split | Epic 2C/3 | Thin route orchestrates drivers domain; logic → packages/domains/drivers |
| 45 | `app/api/admin/employees/route.ts` | `apps/admin/app/api/admin/employees/route.ts` | Split | Epic 2C/3 | Thin route orchestrates auth domain; logic → packages/domains/auth |
| 46 | `app/api/admin/hotels/route.ts` | `apps/admin/app/api/admin/hotels/route.ts` | Split | Epic 2C/3 | Thin route orchestrates hotels domain; logic → packages/domains/hotels |
| 47 | `app/api/admin/hotels/stats/route.ts` | `apps/admin/app/api/admin/hotels/stats/route.ts` | Split | Epic 2C/3 | Thin route orchestrates hotels domain; logic → packages/domains/hotels |
| 48 | `app/api/admin/lookup/route.ts` | `apps/admin/app/api/admin/lookup/route.ts` | Move | Epic 5 | Route moves with admin |
| 49 | `app/api/admin/modules/route.ts` | `apps/admin/app/api/admin/modules/route.ts` | Split | Epic 2C/3 | Thin route orchestrates auth domain; logic → packages/domains/auth |
| 50 | `app/api/admin/orders/[id]/route.ts` | `apps/admin/app/api/admin/orders/[id]/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 51 | `app/api/admin/orders/[id]/status/route.ts` | `apps/admin/app/api/admin/orders/[id]/status/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 52 | `app/api/admin/orders/route.ts` | `apps/admin/app/api/admin/orders/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 53 | `app/api/admin/payments/refund/route.ts` | `apps/admin/app/api/admin/payments/refund/route.ts` | Split | Epic 2C/3 | Thin route orchestrates payments domain; logic → packages/domains/payments |
| 54 | `app/api/admin/payments/route.ts` | `apps/admin/app/api/admin/payments/route.ts` | Split | Epic 2C/3 | Thin route orchestrates payments domain; logic → packages/domains/payments |
| 55 | `app/api/admin/payments/splits/route.ts` | `apps/admin/app/api/admin/payments/splits/route.ts` | Split | Epic 2C/3 | Thin route orchestrates payments domain; logic → packages/domains/payments |
| 56 | `app/api/admin/permissions/mine/route.ts` | `apps/admin/app/api/admin/permissions/mine/route.ts` | Split | Epic 2C/3 | Thin route orchestrates auth domain; logic → packages/domains/auth |
| 57 | `app/api/admin/permissions/route.ts` | `apps/admin/app/api/admin/permissions/route.ts` | Split | Epic 2C/3 | Thin route orchestrates auth domain; logic → packages/domains/auth |
| 58 | `app/api/admin/promotions/route.ts` | `apps/admin/app/api/admin/promotions/route.ts` | Split | Epic 2C/3 | Thin route orchestrates hotels domain; logic → packages/domains/hotels |
| 59 | `app/api/admin/queue/route.ts` | `packages/realtime` | Replace | Epic 4 | Polling aggregator → realtime |
| 60 | `app/api/admin/realtime/route.ts` | `packages/realtime` | Replace | Epic 4 | Polling aggregator → realtime |
| 61 | `app/api/admin/reservations/[id]/assign-driver/route.ts` | `apps/admin/app/api/admin/reservations/[id]/assign-driver/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 62 | `app/api/admin/reservations/route.ts` | `apps/admin/app/api/admin/reservations/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 63 | `app/api/admin/rooms/route.ts` | `apps/admin/app/api/admin/rooms/route.ts` | Split | Epic 2C/3 | Thin route orchestrates hotels domain; logic → packages/domains/hotels |
| 64 | `app/api/admin/settings/route.ts` | `apps/admin/app/api/admin/settings/route.ts` | Split | Epic 2C/3 | Thin route orchestrates settings domain; logic → packages/domains/settings |
| 65 | `app/api/admin/stats/route.ts` | `apps/admin/app/api/admin/stats/route.ts` | Move | Epic 5 | Route moves with admin |
| 66 | `app/api/admin/team/roles/route.ts` | `apps/admin/app/api/admin/team/roles/route.ts` | Split | Epic 2C/3 | Thin route orchestrates auth domain; logic → packages/domains/auth |
| 67 | `app/api/admin/team/route.ts` | `apps/admin/app/api/admin/team/route.ts` | Split | Epic 2C/3 | Thin route orchestrates auth domain; logic → packages/domains/auth |
| 68 | `app/api/admin/users/hotel-assign/route.ts` | `apps/admin/app/api/admin/users/hotel-assign/route.ts` | Split | Epic 2C/3 | Thin route orchestrates auth domain; logic → packages/domains/auth |
| 69 | `app/api/assignments/[id]/accept/route.ts` | `apps/admin/app/api/assignments/[id]/accept/route.ts` | Split | Epic 2C/3 | Thin route orchestrates dispatch domain; logic → packages/domains/dispatch |
| 70 | `app/api/assignments/[id]/decline/route.ts` | `apps/admin/app/api/assignments/[id]/decline/route.ts` | Split | Epic 2C/3 | Thin route orchestrates dispatch domain; logic → packages/domains/dispatch |
| 71 | `app/api/assignments/route.ts` | `apps/admin/app/api/assignments/route.ts` | Split | Epic 2C/3 | Thin route orchestrates dispatch domain; logic → packages/domains/dispatch |
| 72 | `app/api/booking/route.ts` | `apps/admin/app/api/booking/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 73 | `app/api/bookings/delivery-completed/route.ts` | `apps/admin/app/api/bookings/delivery-completed/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 74 | `app/api/bookings/driver-assigned/route.ts` | `apps/admin/app/api/bookings/driver-assigned/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 75 | `app/api/bookings/search/route.ts` | `apps/admin/app/api/bookings/search/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 76 | `app/api/chat/agent-me/route.ts` | `apps/admin/app/api/chat/agent-me/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 77 | `app/api/chat/agents/available/route.ts` | `apps/admin/app/api/chat/agents/available/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 78 | `app/api/chat/agents/route.ts` | `apps/admin/app/api/chat/agents/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 79 | `app/api/chat/ai-response/route.ts` | `apps/admin/app/api/chat/ai-response/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 80 | `app/api/chat/close/route.ts` | `apps/admin/app/api/chat/close/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 81 | `app/api/chat/conversations/route.ts` | `apps/admin/app/api/chat/conversations/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 82 | `app/api/chat/escalate/route.ts` | `apps/admin/app/api/chat/escalate/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 83 | `app/api/chat/messages/route.ts` | `apps/admin/app/api/chat/messages/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 84 | `app/api/chat/rating/route.ts` | `apps/admin/app/api/chat/rating/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 85 | `app/api/chat/request-escalate/route.ts` | `apps/admin/app/api/chat/request-escalate/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 86 | `app/api/chat/send/route.ts` | `apps/admin/app/api/chat/send/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 87 | `app/api/chat/start/route.ts` | `apps/admin/app/api/chat/start/route.ts` | Split | Epic 2C/3 | Thin route orchestrates chat domain; logic → packages/domains/chat |
| 88 | `app/api/config/route.ts` | `packages/config` | Split | Epic 4 | Settings read → config domain |
| 89 | `app/api/cron/process-queue/route.ts` | `packages/realtime` | Move | Epic 4 | Becomes realtime worker trigger |
| 90 | `app/api/flights/validate/route.ts` | `apps/admin/app/api/flights/validate/route.ts` | Split | Epic 2C/3 | Thin route orchestrates booking domain; logic → packages/domains/booking |
| 91 | `app/api/geocode/route.ts` | `apps/admin/app/api/geocode/route.ts` | Split | Epic 2C/3 | Thin route orchestrates maps domain; logic → packages/domains/maps |
| 92 | `app/api/health/route.ts` | `apps/admin/app/api/health` | Keep | Epic 5 | Shared health endpoint |
| 93 | `app/api/hotels/route.ts` | `apps/admin/app/api/hotels/route.ts` | Split | Epic 2C/3 | Thin route orchestrates hotels domain; logic → packages/domains/hotels |
| 94 | `app/api/payments/confirm/route.ts` | `apps/admin/app/api/payments/confirm/route.ts` | Split | Epic 2C/3 | Thin route orchestrates payments domain; logic → packages/domains/payments |
| 95 | `app/api/payments/create-intent/route.ts` | `apps/admin/app/api/payments/create-intent/route.ts` | Split | Epic 2C/3 | Thin route orchestrates payments domain; logic → packages/domains/payments |
| 96 | `app/api/payments/status/route.ts` | `apps/admin/app/api/payments/status/route.ts` | Split | Epic 2C/3 | Thin route orchestrates payments domain; logic → packages/domains/payments |
| 97 | `app/api/promotions/validate/route.ts` | `apps/admin/app/api/promotions/validate/route.ts` | Split | Epic 2C/3 | Thin route orchestrates hotels domain; logic → packages/domains/hotels |
| 98 | `app/api/ratings/route.ts` | `apps/admin/app/api/ratings/route.ts` | Split | Epic 2C/3 | Thin route orchestrates ratings domain; logic → packages/domains/ratings |
| 99 | `app/api/ratings/stats/route.ts` | `apps/admin/app/api/ratings/stats/route.ts` | Split | Epic 2C/3 | Thin route orchestrates ratings domain; logic → packages/domains/ratings |
| 100 | `app/api/webhooks/clerk/route.ts` | `packages/auth` | Move | Epic 4 | Clerk webhook handler (auth package) |
| 101 | `app/api/webhooks/evolution/route.ts` | `apps/admin/app/api/webhooks/evolution/route.ts` | Split | Epic 2C/3 | Thin route orchestrates notifications domain; logic → packages/domains/notifications |
| 102 | `app/api/webhooks/n8n/route.ts` | `apps/admin/app/api/webhooks/n8n/route.ts` | Split | Epic 2C/3 | Thin route orchestrates notifications domain; logic → packages/domains/notifications |
| 103 | `app/api/webhooks/paddle/route.ts` | `apps/admin/app/api/webhooks/paddle/route.ts` | Split | Epic 2C/3 | Thin route orchestrates payments domain; logic → packages/domains/payments |
| 104 | `app/booking/confirmation/page.tsx` | `apps/customer/booking/confirmation/page.tsx` | Move | Epic 7 | Customer booking UI; logic → domains/booking |
| 105 | `app/booking/page.tsx` | `apps/customer/booking/page.tsx` | Move | Epic 7 | Customer booking UI; logic → domains/booking |
| 106 | `app/components/about/about-section.tsx` | `apps/landing/components/about/about-section.tsx` | Move | Epic 6 | Landing section → landing app |
| 107 | `app/components/admin/InactivityGuard.tsx` | `apps/admin/components/InactivityGuard.tsx` | Move | Epic 5 | Admin UI |
| 108 | `app/components/booking/__tests__/booking-form.test.tsx` | `apps/customer` | Move | Epic 7 | Tests move with component |
| 109 | `app/components/booking/__tests__/booking-store.test.ts` | `apps/customer` | Move | Epic 7 | Tests move with component |
| 110 | `app/components/booking/__tests__/date-enforcement.test.ts` | `apps/customer` | Move | Epic 7 | Tests move with component |
| 111 | `app/components/booking/__tests__/flight-validation.test.ts` | `apps/customer` | Move | Epic 7 | Tests move with component |
| 112 | `app/components/booking/__tests__/persistence.test.ts` | `apps/customer` | Move | Epic 7 | Tests move with component |
| 113 | `app/components/booking/__tests__/toast.test.tsx` | `apps/customer` | Move | Epic 7 | Tests move with component |
| 114 | `app/components/booking/booking-confirmation.tsx` | `apps/customer/components/booking/booking-confirmation.tsx` | Move | Epic 7 | Booking UI → customer app |
| 115 | `app/components/booking/booking-form.tsx` | `apps/customer/components/booking/booking-form.tsx` | Move | Epic 7 | Booking UI → customer app |
| 116 | `app/components/booking/booking-summary.tsx` | `apps/customer/components/booking/booking-summary.tsx` | Move | Epic 7 | Booking UI → customer app |
| 117 | `app/components/booking/lib/booking-store.ts` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 118 | `app/components/booking/lib/country-dial-codes.ts` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 119 | `app/components/booking/lib/error-boundary.tsx` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 120 | `app/components/booking/lib/flight-validation.ts` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 121 | `app/components/booking/lib/logger.ts` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 122 | `app/components/booking/lib/payment-store.ts` | `packages/domains/payments` | Delete | Epic 3 | Duplicate of payment-service; delete after migration |
| 123 | `app/components/booking/lib/persistence.ts` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 124 | `app/components/booking/lib/phone-validation.ts` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 125 | `app/components/booking/lib/toast.tsx` | `packages/domains/booking` | Split | Epic 3 | Client logic → booking domain (remove DB access from browser) |
| 126 | `app/components/booking/lib/types.ts` | `packages/domains/booking` | Split | Epic 3 | Booking types keep; PaymentRecord merged into payments type |
| 127 | `app/components/booking/phone-input-with-country.tsx` | `apps/customer/components/booking/phone-input-with-country.tsx` | Move | Epic 7 | Booking UI → customer app |
| 128 | `app/components/booking/step-destination.tsx` | `apps/customer/components/booking/step-destination.tsx` | Move | Epic 7 | Booking UI → customer app |
| 129 | `app/components/booking/step-flight-logistics.tsx` | `apps/customer/components/booking/step-flight-logistics.tsx` | Move | Epic 7 | Booking UI → customer app |
| 130 | `app/components/booking/step-packages.tsx` | `apps/customer/components/booking/step-packages.tsx` | Move | Epic 7 | Booking UI → customer app |
| 131 | `app/components/booking/step-payment.tsx` | `apps/customer/components/booking/step-payment.tsx` | Move | Epic 7 | Booking UI → customer app |
| 132 | `app/components/booking/step-progress.tsx` | `apps/customer/components/booking/step-progress.tsx` | Move | Epic 7 | Booking UI → customer app |
| 133 | `app/components/booking/step-traveler-profile.tsx` | `apps/customer/components/booking/step-traveler-profile.tsx` | Move | Epic 7 | Booking UI → customer app |
| 134 | `app/components/chat/ChatWidget.tsx` | `apps/admin/components/chat/ChatWidget.tsx` | Split | Epic 5 | Chat UI → admin; logic → domains/chat |
| 135 | `app/components/chat/ChatWidget.tsx.backup` | `apps/admin/components/chat/ChatWidget.tsx.backup` | Split | Epic 5 | Chat UI → admin; logic → domains/chat |
| 136 | `app/components/chat/__tests__/ChatWidget.test.tsx` | `apps/admin` | Move | Epic 5 | Tests move with component |
| 137 | `app/components/chat/__tests__/chat-service.test.ts` | `apps/admin` | Move | Epic 5 | Tests move with component |
| 138 | `app/components/chat/__tests__/comment-filter.test.ts` | `apps/admin` | Move | Epic 5 | Tests move with component |
| 139 | `app/components/chat/__tests__/ollama-service.test.ts` | `apps/admin` | Move | Epic 5 | Tests move with component |
| 140 | `app/components/concierge/concierge-card.tsx` | `apps/landing/components/concierge/concierge-card.tsx` | Move | Epic 6 | Concierge UI → landing |
| 141 | `app/components/concierge/concierge-section.tsx` | `apps/landing/components/concierge/concierge-section.tsx` | Move | Epic 6 | Concierge UI → landing |
| 142 | `app/components/cta/cta-section.tsx` | `apps/landing/components/cta/cta-section.tsx` | Move | Epic 6 | Landing section → landing app |
| 143 | `app/components/experiences/experiences-section.tsx` | `apps/landing/components/experiences/experiences-section.tsx` | Move | Epic 6 | Landing section → landing app |
| 144 | `app/components/hero/hero-cta.tsx` | `apps/landing/components/hero/hero-cta.tsx` | Move | Epic 6 | Landing section → landing app |
| 145 | `app/components/hero/hero-section.tsx` | `apps/landing/components/hero/hero-section.tsx` | Move | Epic 6 | Landing section → landing app |
| 146 | `app/components/how-it-works/how-it-works-section.tsx` | `apps/landing/components/how-it-works/how-it-works-section.tsx` | Move | Epic 6 | Landing section → landing app |
| 147 | `app/components/how-it-works/step-card.tsx` | `apps/landing/components/how-it-works/step-card.tsx` | Move | Epic 6 | Landing section → landing app |
| 148 | `app/components/layout/footer.tsx` | `apps/landing/components/layout/footer.tsx` | Move | Epic 6 | Landing section → landing app |
| 149 | `app/components/layout/header.tsx` | `apps/landing/components/layout/header.tsx` | Move | Epic 6 | Landing section → landing app |
| 150 | `app/components/pricing/pricing-section.tsx` | `apps/landing/components/pricing/pricing-section.tsx` | Move | Epic 6 | Landing section → landing app |
| 151 | `app/components/ratings/RatingCard.tsx` | `packages/ui` | Split | Epic 4 | Shared rating UI → ui package; logic → domains/ratings |
| 152 | `app/components/ratings/RatingForm.tsx` | `packages/ui` | Split | Epic 4 | Shared rating UI → ui package; logic → domains/ratings |
| 153 | `app/components/ratings/RatingStats.tsx` | `packages/ui` | Split | Epic 4 | Shared rating UI → ui package; logic → domains/ratings |
| 154 | `app/components/ratings/RatingsProvider.tsx` | `packages/ui` | Split | Epic 4 | Shared rating UI → ui package; logic → domains/ratings |
| 155 | `app/components/ratings/TestimonialsSlider.tsx` | `packages/ui` | Split | Epic 4 | Shared rating UI → ui package; logic → domains/ratings |
| 156 | `app/components/stats/stats-bar.tsx` | `apps/landing/components/stats/stats-bar.tsx` | Move | Epic 6 | Landing section → landing app |
| 157 | `app/components/testimonials/testimonials-section.tsx` | `apps/landing/components/testimonials/testimonials-section.tsx` | Move | Epic 6 | Landing section → landing app |
| 158 | `app/components/ui/button.tsx` | `packages/ui` | Move | Epic 4 | Shared design-system component |
| 159 | `app/components/ui/input.tsx` | `packages/ui` | Move | Epic 4 | Shared design-system component |
| 160 | `app/components/ui/lang-toggle.tsx` | `packages/ui` | Move | Epic 4 | Shared design-system component |
| 161 | `app/components/ui/leaflet-map.tsx` | `packages/ui` | Move | Epic 4 | Maps component → ui package |
| 162 | `app/error.tsx` | `apps/landing` | Move | Epic 6 | Public site shell → landing app |
| 163 | `app/globals.css` | `apps/landing` | Move | Epic 6 | Global styles → landing app (shared via ui package later) |
| 164 | `app/hooks/use-count-up.ts` | `apps/landing` | Move | Epic 6 | Landing UI hooks |
| 165 | `app/hooks/use-scroll-reveal.ts` | `apps/landing` | Move | Epic 6 | Landing UI hooks |
| 166 | `app/layout.tsx` | `apps/landing` | Move | Epic 6 | Public site shell → landing app |
| 167 | `app/loading.tsx` | `apps/landing` | Move | Epic 6 | Public site shell → landing app |
| 168 | `app/not-found.tsx` | `apps/landing` | Move | Epic 6 | Public site shell → landing app |
| 169 | `app/opengraph-image.tsx` | `apps/landing` | Move | Epic 6 | Public site shell → landing app |
| 170 | `app/page.tsx` | `apps/landing` | Move | Epic 6 | Landing page |
| 171 | `app/reset-password/page.tsx` | `apps/admin` | Move | Epic 5 | Auth pages → admin (or shared auth shell) |
| 172 | `app/robots.ts` | `apps/landing` | Move | Epic 6 | Public site shell → landing app |
| 173 | `app/sign-in/[[...sign-in]]/page.tsx` | `apps/admin` | Move | Epic 5 | Auth pages → admin (or shared auth shell) |
| 174 | `app/sitemap.ts` | `apps/landing` | Move | Epic 6 | Public site shell → landing app |
| 175 | `eslint.config.mjs` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 176 | `lib/admin/admin-fetch.ts` | `packages/api` | Move | Epic 4 | Shared admin API client |
| 177 | `lib/admin/auth.ts` | `packages/auth` | Move | Epic 4 | Identity + RBAC; dedupe auto-register (see permissions) |
| 178 | `lib/admin/date-filter-context.tsx` | `apps/admin` | Move | Epic 5 | Admin UI context |
| 179 | `lib/admin/hotel-auth.ts` | `packages/auth` | Move | Epic 4 | Hotel context resolver |
| 180 | `lib/admin/permissions.ts` | `packages/auth` | Move | Epic 4 | Permission checks; merge 3 auto-register copies here |
| 181 | `lib/admin/realtime-context.tsx` | `packages/realtime` | Replace | Epic 4 | Client polling → Socket.IO client (ADR-004) |
| 182 | `lib/admin/toast-context.tsx` | `apps/admin` | Move | Epic 5 | Admin UI context |
| 183 | `lib/config.ts` | `packages/config` | Move | Epic 4 | Settings-backed config + env validation |
| 184 | `lib/conversation.ts` | `packages/domains/chat` | Move | Epic 3 | Conversation model |
| 185 | `lib/countries.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 186 | `lib/date-utils.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 187 | `lib/db/migrate-auto.ts` | `packages/db` | Merge | Epic 4 | Fold RBAC bootstrap into migrations; remove second schema path |
| 188 | `lib/db/migrations/007_chat_tables.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 189 | `lib/db/migrations/008_whatsapp_phone.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 190 | `lib/db/migrations/009_whatsapp_events.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 191 | `lib/db/migrations/010_drivers_table.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 192 | `lib/db/migrations/011_dispatch_columns.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 193 | `lib/db/migrations/012_clerk_auth_employees.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 194 | `lib/db/migrations/013_fix_orders_assigned_fk.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 195 | `lib/db/migrations/014_customers_table.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 196 | `lib/db/migrations/015_sync_payment_status.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 197 | `lib/db/migrations/016_add_return_columns.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 198 | `lib/db/migrations/017_cases_tables.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 199 | `lib/db/migrations/018_add_driver_commission_rate.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 200 | `lib/db/migrations/019_settings_table.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 201 | `lib/db/migrations/020_support_chat_evolution.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 202 | `lib/db/migrations/021_ratings_table.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 203 | `lib/db/migrations/022_conversation_response_time.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 204 | `lib/db/migrations/023_driver_compliance.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 205 | `lib/db/migrations/024_rbac_modules.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 206 | `lib/db/migrations/025_hotels_rooms_promotions.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 207 | `lib/db/migrations/026_stripe_webhook_dedup.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 208 | `lib/db/migrations/027_outgoing_message_queue.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 209 | `lib/db/migrations/028_assignments.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 210 | `lib/db/migrations/029_paddle_payments.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 211 | `lib/db/migrations/030_split_payment_columns.sql` | `packages/db/migrations` | Move | Epic 4 | Migrations migrate as-is; review for Drizzle |
| 212 | `lib/db.ts` | `packages/db` | Replace | Epic 4 | Raw @libsql/client → Drizzle client (ADR-003); keep as DB access boundary |
| 213 | `lib/design-tokens.ts` | `packages/ui` | Move | Epic 4 | Design tokens |
| 214 | `lib/dispatch/availability.ts` | `packages/domains/dispatch` | Move | Epic 3 | Availability + duration estimation (clean module, keep) |
| 215 | `lib/i18n/index.tsx` | `packages/shared/i18n` | Move | Epic 4 | Shared i18n |
| 216 | `lib/i18n/locales/en.ts` | `packages/shared/i18n` | Move | Epic 4 | Shared i18n |
| 217 | `lib/i18n/locales/es.ts` | `packages/shared/i18n` | Move | Epic 4 | Shared i18n |
| 218 | `lib/i18n/server.ts` | `packages/shared/i18n` | Move | Epic 4 | Shared i18n |
| 219 | `lib/language-utils.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 220 | `lib/logger.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 221 | `lib/message.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 222 | `lib/moderation/comment-filter.ts` | `packages/domains/moderation` | Move | Epic 3 | Comment filter |
| 223 | `lib/n8n/client.ts` | `packages/domains/notifications` | Split | Epic 3 | Split HTTP client / circuit breaker / triggers / templating; centralize i18n |
| 224 | `lib/paddle/server.ts` | `packages/domains/payments` | Move | Epic 3 | Paddle SDK server wrapper |
| 225 | `lib/payment-record.ts` | `packages/domains/payments` | Move | Epic 3 | Single PaymentRecord type (authoritative) |
| 226 | `lib/phone-utils.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 227 | `lib/pricing.ts` | `packages/config` | Merge | Epic 4 | Redundant alias of config.ts; fold in |
| 228 | `lib/queue/message-queue.ts` | `packages/realtime` | Move | Epic 4 | Outbox + worker → realtime package |
| 229 | `lib/queue/whatsapp-worker.ts` | `packages/realtime` | Move | Epic 4 | Outbox + worker → realtime package |
| 230 | `lib/rate-limit.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 231 | `lib/reservations-api.ts` | `apps/admin/lib` | Move | Epic 5 | Admin API client wrapper |
| 232 | `lib/reservations-types.ts` | `packages/domains/booking` | Move | Epic 3 | Reservation/order types |
| 233 | `lib/resilience/circuit-breaker.ts` | `packages/shared` | Move | Epic 4 | Shared resilience util |
| 234 | `lib/services/agent-service.ts` | `packages/domains` | Move | Epic 3 |  |
| 235 | `lib/services/booking-service.ts` | `packages/domains` | Move | Epic 3 |  |
| 236 | `lib/services/chat-service.ts` | `packages/domains` | Move | Epic 3 |  |
| 237 | `lib/services/ollama-service.ts` | `packages/domains` | Move | Epic 3 |  |
| 238 | `lib/services/payment-service.ts` | `packages/domains` | Move | Epic 3 |  |
| 239 | `lib/services/rating-service.ts` | `packages/domains` | Move | Epic 3 |  |
| 240 | `lib/services/whatsapp-service.ts` | `packages/domains` | Move | Epic 3 |  |
| 241 | `lib/string-utils.ts` | `packages/shared` | Move | Epic 4 | Framework-agnostic util |
| 242 | `lib/trm.ts` | `packages/domains/booking` | Move | Epic 3 | USD/COP FX util → booking domain |
| 243 | `lib/webhook-auth.ts` | `packages/auth` | Move | Epic 4 | Webhook signature verification (shared) |
| 244 | `lib/whatsapp-event.ts` | `packages/realtime` | Move | Epic 4 | Typed event catalog (foundation for event bus) |
| 245 | `middleware.ts` | `packages/auth` | Move | Epic 4 | Shared Clerk middleware consumed by apps |
| 246 | `n8n/docker-entrypoint.sh` | `(n8n infra, outside monorepo)` | Keep | - | External workflow infra; not part of app packages |
| 247 | `n8n/workflows/ai-chat-message.json` | `(n8n infra, outside monorepo)` | Keep | - | External workflow infra; not part of app packages |
| 248 | `n8n/workflows/auditoria-terminos.json` | `(n8n infra, outside monorepo)` | Keep | - | External workflow infra; not part of app packages |
| 249 | `n8n/workflows/bot-judicial.json` | `(n8n infra, outside monorepo)` | Keep | - | External workflow infra; not part of app packages |
| 250 | `n8n/workflows/llamados.json` | `(n8n infra, outside monorepo)` | Keep | - | External workflow infra; not part of app packages |
| 251 | `next-env.d.ts` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 252 | `next.config.js` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 253 | `package.json` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 254 | `postcss.config.js` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 255 | `scripts/migrate.ts` | `packages/db/scripts` | Move | Epic 4 | Migration runner |
| 256 | `scripts/setup-admin.ts` | `packages/auth/scripts` | Move | Epic 4 | Admin bootstrap |
| 257 | `skills-lock.json` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 258 | `tailwind.config.js` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 259 | `tsconfig.json` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 260 | `vercel.json` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |
| 261 | `vitest.config.ts` | `(repo root)` | Keep | - | Build/config; becomes monorepo workspace root |

**Total classified:** 261 files.
