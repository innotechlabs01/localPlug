# Ratings (Real Module — Digital Twin)

> Source of truth for what EXISTS TODAY. No code changes.

## Real files & responsibilities

- **File:** `lib/services/rating-service.ts`
  - **Responsibilities (real):** ✔ `createRating` inserts into `ratings` (`conversation_id`, `customer_name`, `customer_country`, `rating`, `comment`, `resolved`, `first_response_time_ms`) and returns the inserted row. ✔ `getLatestRatings(limit)` returns latest N ratings (no `resolved`/`updated_at`). ✔ `getRatingStats()` aggregates `avg_rating`/`total_ratings`/`resolved_pct`/`avg_response_time_ms`. ✔ `ratingExistsForConversation` dedupe check. ✔ `getFirstResponseTimeMs` computes `(julianday(first_agent_response_at) - julianday(created_at)) * 86400000` from `conversations`.
  - **Problem (real):** This is the only real ratings "service" — a thin data-access module, not a domain service. It couples rating creation to `conversations.first_agent_response_at` (cross-domain dependency on the chat/conversation table). No validation/business rules here (those live in the route).

- **File:** `app/api/ratings/route.ts`
  - **Responsibilities (real):** ✔ `GET` returns latest 10 ratings via `getLatestRatings(10)`. ✔ `POST` validates required fields (`conversation_id`, `customer_name`, `customer_country`, `rating`), rating range 1–5, name ≤150 / country ≤100 char limits; verifies the `conversations` row exists; dedupes via `ratingExistsForConversation`; calls `filterComment(comment)` (Moderation) to produce `filteredComment`; fetches `first_response_time_ms`; inserts with `resolved=1`.
  - **Problem (real):** Validation + moderation + conversation-existence checks are inline in the route. Depends on `lib/moderation/comment-filter` (Moderation domain) and `conversations` table. Rating is always created `resolved=1` — no unresolved/moderation-queue workflow despite a `resolved` column.

- **File:** `app/api/ratings/stats/route.ts`
  - **Responsibilities (real):** ✔ `GET` returns `getRatingStats()` behind an in-memory 30s cache (`statsCache` module-level var).
  - **Problem (real):** Caching is a module-level mutable singleton — not shared/coordinated across instances (serverless-incompatible). No `revalidate`/cache invalidation strategy.

- **File:** `app/components/ratings/RatingsProvider.tsx`
  - **Responsibilities (real):** ✔ Client context provider fetching `/api/ratings` and `/api/ratings/stats`; polls every 15s (ratings) / 30s (stats); pauses polling on `document.hidden`; exposes `useRatings()` and `formatResponseTime(ms)`.
  - **Problem (real):** Polling intervals duplicate the 30s server cache TTL. `formatResponseTime` is a presentation helper living in a data provider.

- **File:** `app/components/ratings/RatingForm.tsx`
  - **Responsibilities (real):** ✔ Client form: star selector, name/country/comment inputs, `localStorage` "already rated" guard (`rated_<conversationId>`), POSTs to `/api/ratings`. Uses i18n `t.ratings`.
  - **Problem (real):** Client-side `localStorage` dedupe is a UX guard only; server-side dedupe is the real control. No re-validation of limits on the client.

- **File:** `app/components/ratings/RatingCard.tsx`
  - **Responsibilities (real):** ✔ Pure presentational card: star display, comment quote, name/country/date. No data fetching.
  - **Problem (real):** None functionally; purely presentational (good).

- **File:** `app/components/ratings/TestimonialsSlider.tsx`
  - **Responsibilities (real):** ✔ Embla-carousel slider consuming `useRatings()`; auto-advances every 5s; prev/next/dots nav; hidden when no ratings.
  - **Problem (real):** Carousel behavior (auto-advance, loop threshold `>2`) is presentation logic; acceptable in component.

- **File:** `app/components/ratings/RatingStats.tsx`
  - **Responsibilities (real):** ✔ Presentational stats block (avg / total / resolved% / response time) from `useRatings()` + `formatResponseTime`.
  - **Problem (real):** None functionally.

- **File:** `app/components/testimonials/testimonials-section.tsx` (usage reference, not in listed path but real consumer)
  - **Responsibilities (real):** ✔ Wraps `RatingsProvider` + `TestimonialsSlider` for the public landing page testimonials section.
  - **Problem (real):** Confirms the Ratings module is consumed by the public marketing page, not just admin.

## Module-level real responsibilities
- ✔ Rating submission (validated, moderated, conversation-linked, deduped).
- ✔ Rating listing (latest N) and aggregate stats with short-lived cache.
- ✔ Public testimonials display (provider + slider + card + stats components).
- ✔ Cross-domain dependency: ratings read `conversations` for existence + first-response time.

## Proposed split (target per Blueprint domains/packages)
- `packages/domains/ratings` — `RatingService` (validation + create + dedupe + stats), `RatingRepository` (move `rating-service.ts` SQL here), `RatingValidator`.
- `packages/domains/ratings/moderation` — keep `filterComment` call but own the resolved/unresolved workflow (today `resolved` is always 1; add a moderation queue).
- `packages/infra/cache` — replace module-level `statsCache` singleton with a shared cache (e.g. `unstable_cache`/`CacheService`).
- `packages/domains/conversations` (or events) — `getFirstResponseTimeMs` should be owned by the conversation domain, not ratings.
- `packages/ui/ratings` — keep `RatingsProvider`/`RatingForm`/`RatingCard`/`TestimonialsSlider`/`RatingStats` as a UI package; move `formatResponseTime` into a shared util.

## Dependency observations (real)
- `app/api/ratings/route.ts` imports: `next/server`, `@/lib/db` (`getDb`), `@/lib/services/rating-service` (4 fns), `@/lib/moderation/comment-filter` (`filterComment`).
- `app/api/ratings/stats/route.ts` imports: `next/server`, `@/lib/services/rating-service` (`getRatingStats`).
- `rating-service.ts` imports only `@/lib/db` (`getDb`) but queries the `conversations` table (implicit cross-domain dependency).
- UI components import `useI18n` (`@/lib/i18n`) and each other; `RatingsProvider` is the hub. `TestimonialsSlider` depends on `embla-carousel-react` (external dep).
- `filterComment` is the only Moderation coupling; there is a unit test at `app/components/chat/__tests__/comment-filter.test.ts` confirming the moderation contract.
