# Database Checklist

Apply to every schema/migration change. Derived from `../00-CONSTITUTION.md` §8 and
`archive/spec-v1` §12.

## Schema
- [ ] UUID v4 primary keys on all tables
- [ ] Soft deletes (`deleted_at` + `deleted_by`) on core tables
- [ ] Optimistic concurrency (`version` + `updated_at`) on hot tables
- [ ] Audit timestamps (`created_at`, `updated_at`)
- [ ] Enums for status fields
- [ ] Unique constraints enforce business rules
- [ ] Explicit foreign keys

## Naming (`../10-reference/naming.md`)
- [ ] Tables plural, snake_case (`driver_documents`)
- [ ] Junction `{a}_{b}`; log `{entity}_{purpose}_log`
- [ ] Columns snake_case; FKs `{table}_id`

## Migrations
- [ ] Additive only; never modify existing migration files
- [ ] Versioned SQL in `packages/db/migrations/`
- [ ] Rollback script for production migrations
- [ ] Indexes on frequently queried columns

## Consistency
- [ ] Schema matches the relevant State Machine (`07-state-machines/`)
- [ ] Cross-domain queries avoided (each domain owns its data)
