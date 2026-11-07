# MIGRATION (Customers)

## Current State
- **Location**: `app/api/customers/` (API routes), `app/admin/customers/` (admin page)
- **Tables**: `customers` (Drizzle schema), `customers` (raw SQL migration)
- **API Routes**: `app/api/customers/sync/route.ts` (sync function)
- **Admin Pages**: `/admin/customers` (direct DB queries)
- **Dependencies**: Booking (customer bookings), Chat (customer conversations), Analytics (customer metrics)

## Key Problems
1. **Schema discrepancy** — Drizzle schema and raw SQL migration have different columns
2. **No domain service** — business logic in API routes
3. **Sync function** — inline customer synchronization
4. **No events** — customer state changes not published
5. **No preferences** — notification preferences not managed

## Extraction Plan

| Step | Task | Depends On | Effort | Status |
|------|------|-----------|--------|--------|
| 1 | Fix schema discrepancy | — | 1 day | ⬜ |
| 2 | Create domain package `packages/domains/customers/` | Step 1 | 1 day | ⬜ |
| 3 | Extract entities (Customer, Preference, Address) | Step 2 | 2 days | ⬜ |
| 4 | Extract PrivacyPolicy, MergePolicy | Step 3 | 1 day | ⬜ |
| 5 | Create CustomerService | Step 4 | 2 days | ⬜ |
| 6 | Extract repositories | Step 5 | 1 day | ⬜ |
| 7 | Create domain events | Step 6 | 1 day | ⬜ |
| 8 | Refactor API routes | Step 7 | 2 days | ⬜ |
| 9 | Refactor Admin page | Step 8 | 2 days | ⬜ |
| 10 | Add tests | Step 9 | 2 days | ⬜ |
| 11 | Update documentation | Step 10 | 1 day | ⬜ |

**Total effort**: ~16 days

## Dependencies
- **Booking domain**: Customer bookings
- **Chat domain**: Customer conversations
- **Analytics domain**: Customer metrics

## Risk Assessment
- **Risk 1**: Schema migration breaks existing data → Mitigation: Backup + staged migration
- **Risk 2**: Customer data loss during merge → Mitigation: Audit log + rollback plan

## Rollback Plan
- Feature flag: `use-customer-domain`
- If extraction fails: Revert to inline logic
- Backup: Full database backup before migration
