# RATINGS DOMAIN

> Rating collection, aggregation, and quality scoring.

## Responsibility
- Owns: ratings, reviews, quality scores, aggregation rules
- Does NOT own: chat conversations (Chat), driver profiles (Drivers), hotel profiles (Hotels)

## Boundaries
- Inbound: Chat (post-conversation), Customer app, Admin
- Outbound: Drivers (quality scores), Hotels (quality scores), Analytics (metrics)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 28%
- Extraction: Not started

## Domain Model
- Entities: Rating, Review, QualityScore
- Value Objects: RatingValue (1-5), ReviewStatus, QualityLevel
- Aggregates: Rating (root, invariants: one rating per conversation, no self-rating)
- Events: rating.submitted, rating.aggregated, quality.score_updated
- Policies: RatingRules, AggregationPolicy, QualityThresholdPolicy
