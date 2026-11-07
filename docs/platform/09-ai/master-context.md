# AI — Master Context

> Load this file first when acting on or instructing an AI about LocalPlug.

## What LocalPlug is
A **Business Platform / Operating System** for premium airport transfers and tourism
concierge in Medellín. It connects Travelers, Drivers, and Dispatchers across multiple
applications (Admin, Driver, Customer, Landing) built on shared business domains.

## Architecture in one paragraph
Turborepo monorepo. `apps/*` are thin, interchangeable front-ends. `packages/domains/*`
hold all business logic. `packages/api` orchestrates; `packages/realtime` (Socket.IO)
broadcasts typed events. `packages/db` is Turso + Drizzle. Auth is Clerk + WhatsApp OTP.
Deployment is Docker + Coolify on Hetzner (persistent WebSocket, not serverless).

## Reading order for an AI agent
1. `../PLATFORM_INDEX.md` (navigation)
2. `../00-CONSTITUTION.md` (immutable rules)
3. `architecture-rules.md`, `implementation-rules.md`
4. The specific `01-business/`, `06-workflows/`, `07-state-machines/` files for the task
5. `05-decisions/` ADRs if questioning a past decision

## Golden constraints
- Business rules never depend on frameworks.
- Apps contain no business logic; domains do.
- Cross-domain communication only via typed events.
- Documentation is migrated, never deleted (`archive/`).
- Every decision worth keeping is an ADR.

## Tech stack
Next.js 15 · TypeScript 5 · Tailwind 3.4 · Clerk 7.4 · Turso/Drizzle · Socket.IO 4 ·
Paddle · n8n · Evolution API · Vitest · pnpm · Turborepo · Docker/Coolify · Hetzner.

See `10-reference/` for naming/conventions and `archive/spec-v1` for the v1 spec.
