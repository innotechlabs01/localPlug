# API Checklist

Apply to every endpoint. Derived from `../00-CONSTITUTION.md` §16 and `../02-architecture/packages.md`.

## Design
- [ ] REST-ish: `GET /api/{resource}`, `POST /api/{resource}/:id/action`
- [ ] Authentication required (Clerk JWT)
- [ ] Input validated with Zod (`packages/validation`)
- [ ] Business logic delegated to domain service
- [ ] Events emitted for side effects (realtime, notifications)

## Responses
- [ ] Success shape: `{ success, data, meta }`
- [ ] Error shape: `{ success:false, error:{ code, message, details } }`
- [ ] Pagination for list endpoints
- [ ] Selective field fetching

## Rules
- [ ] Driver endpoints verify `account_status = approved`
- [ ] Driver scoped to own data
- [ ] Idempotent where possible
- [ ] No direct DB access from route; goes through domain

## Docs
- [ ] Endpoint added to API reference / relevant domain doc
- [ ] Request/response example present
