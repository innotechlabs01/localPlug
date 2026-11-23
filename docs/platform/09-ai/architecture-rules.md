# AI — Architecture Rules

Non-negotiable structural rules an AI must enforce (subset of the Constitution).

## Dependency direction
```
apps/* → packages/* + packages/domains/*
packages/api → domains/*, db, auth, realtime
packages/domains → db, types, validation
packages/realtime → pure broadcast, NO business logic
packages/auth → identity only, NO authz rules
packages/db → persistence only, NO business logic
packages/* → NEVER import apps/*
```

## Layering (never invert)
Business Domains → Application Layer → Platform Services → Infrastructure.

## Domain boundaries
- Domains talk via events, not direct calls.
- Each domain owns its data; no cross-domain queries.
- Logic in `packages/domains/*`, never UI or API routes.
- Each domain has its own Zod schemas.

## Data
- Turso + Drizzle; UUID v4 PKs; soft deletes; optimistic concurrency; audit timestamps.
- Enums for status; unique constraints enforce rules; explicit FKs.

## Realtime
- Socket.IO; rooms `driver:{id}`, `dispatch`, `admin`, `all-drivers`.
- Persistent process; Redis adapter for scale; no business logic in layer.

## Auth
- Clerk + WhatsApp OTP; phone is driver primary id (UNIQUE); claim-first.
- Authz (RBAC) in domain services, not `packages/auth`.

Violations → stop, explain, propose fix. Record new decisions as ADRs.
