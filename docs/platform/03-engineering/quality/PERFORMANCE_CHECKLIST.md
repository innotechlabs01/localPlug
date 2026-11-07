# Performance Checklist

Apply to every feature. Derived from `../03-engineering/performance.md`.

## Frontend
- [ ] FCP < 1.5s; TTI < 3s
- [ ] Code splitting per route
- [ ] Images optimized (WebP, lazy load)
- [ ] Service worker caching for repeat visits

## API
- [ ] P95 response < 200ms
- [ ] DB connection pooling (concurrency: 16)
- [ ] Query optimization with Drizzle
- [ ] Pagination for lists
- [ ] Selective field fetching (no SELECT *)

## Realtime
- [ ] Event delivery < 500ms
- [ ] Room-based broadcasting (no storms)
- [ ] Client-side event deduplication
- [ ] Batch high-frequency updates

## Database
- [ ] Indexes on hot columns
- [ ] No N+1 queries
- [ ] Connection retry with exponential backoff
- [ ] Reads avoid hot transactional tables where possible
