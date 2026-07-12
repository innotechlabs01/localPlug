# RATINGS DOMAIN

> Rating collection, aggregation, and quality scoring.

## Responsibility
- Owns: ratings, reviews, quality scores, aggregation
- Does NOT own: chat conversations (Chat), driver profiles (Drivers)

## Boundaries
- Inbound: Chat (post-conversation), Admin, Customer app
- Outbound: Drivers (quality scores), Analytics (metrics)

## Status
- Maturity: 28%
- Extraction: Not started (2 duplicate tables)
- Portal: None

## Domain Model
- **Entities**: Rating, Review, QualityScore
- **Value Objects**: RatingValue, ReviewStatus, QualityLevel
- **Aggregates**: Rating (root: Rating, invariants: one rating per conversation)
- **Events**: rating.submitted, rating.aggregated, quality.score_updated
- **Policies**: Rating rules, aggregation formulas, quality thresholds

## Key Files
- `lib/rating-service.ts` — Rating service (needs extraction)
- `components/chat/` — 4 rating components
- `packages/db/src/domains/chat/` — ratings + conversation_ratings (2 tables, need consolidation)

## Extraction Plan
1. Consolidate 2 rating tables
2. Create Ratings domain package
3. Extract from Chat domain
