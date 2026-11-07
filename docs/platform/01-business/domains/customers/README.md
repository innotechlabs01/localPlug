# CUSTOMERS DOMAIN

> Customer profiles, preferences, account management, and privacy.

## Responsibility
- Owns: customer profiles, preferences, addresses, account settings, data privacy
- Does NOT own: bookings (Booking), payments (Payments), chat (Chat), ratings (Ratings)

## Boundaries
- Inbound: Customer app, Admin, API consumers
- Outbound: Booking (create), Chat (message), Notifications (preferences), Analytics (metrics)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 25%
- Extraction: Not started

## Domain Model
- Entities: Customer, CustomerPreference, CustomerAddress, CustomerContact
- Value Objects: CustomerStatus, Language, Currency, ContactType
- Aggregates: Customer (root, invariants: profile completeness, privacy rules)
- Events: customer.created, customer.updated, customer.deactivated, customer.merged
- Policies: PrivacyPolicy, MergePolicy, ProfileCompletenessPolicy
