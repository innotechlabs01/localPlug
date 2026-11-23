# Engineering — Performance

## Frontend
- FCP < 1.5s; TTI < 3s.
- Code splitting per route.
- Image optimization (WebP, lazy loading).
- Service worker caching for repeat visits.

## API
- P95 response < 200ms.
- DB connection pooling (concurrency: 16).
- Query optimization with Drizzle.
- Pagination for list endpoints.
- Selective field fetching.

## Realtime
- Event delivery < 500ms.
- Room-based broadcasting (no storms).
- Event deduplication on client.
- Batch updates for high-frequency events.

## Database
- Indexes on frequently queried columns.
- Composite indexes for common filters.
- Avoid N+1 queries.
- Use selects, not full-column fetches.
- Connection retry with exponential backoff.
