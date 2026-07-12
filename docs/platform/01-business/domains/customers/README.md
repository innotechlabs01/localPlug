# CUSTOMERS DOMAIN

> Customer profiles, preferences, and account management.

## Responsibility
- Owns: customer profiles, preferences, account settings
- Does NOT own: bookings (Booking), payments (Payments), chat (Chat)

## Boundaries
- Inbound: Customer app, Admin, API consumers
- Outbound: Booking (create), Chat (message), Notifications (preferences)

## Status
- Maturity: 25%
- Extraction: Not started
- Portal: None (Customer app planned)

## Domain Model
- **Entities**: Customer, CustomerPreference, CustomerAddress
- **Value Objects**: CustomerStatus, Language, Currency
- **Aggregates**: Customer (root: Customer, invariants: profile completeness)
- **Events**: customer.registered, customer.updated, customer.deactivated
- **Policies**: Profile completion rules, preference defaults

## Key Files
- `app/api/customers/` — API routes (needs extraction)
- `app/admin/customers/` — Admin page (needs refactor)

## Extraction Plan
1. Fix schema discrepancy (Drizzle vs raw SQL)
2. Create domain package
3. Extract logic from API routes
4. Refactor admin page to use API
