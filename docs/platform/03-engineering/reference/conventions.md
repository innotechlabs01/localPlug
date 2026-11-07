# Reference — Conventions

## Git
- Branch: `feat/...`, `fix/...`, `refactor/...`, `docs/...`, `chore/...`
- Commit: `<type>(<scope>): <subject>` + body + `Closes #n`
- PR: one change per PR; tests green; screenshots for UI; no `TODO` in merged code.

## Documentation
- Every architectural decision is documented (ADR in `05-decisions/`).
- Docs live near the code they describe; platform docs under `docs/platform/`.
- Major restructures **move** old trees to `archive/spec-vN/` — never delete.
- `../PLATFORM_INDEX.md` is the single entry point for humans and AIs.

## Code
- TypeScript strict mode.
- Server Components by default; `'use client'` only when needed.
- Components < 200 lines, one per file.
- Import order: React/Next → external → shared packages → domains → local.

## API
- REST-ish: `GET /api/{resource}`, `POST /api/{resource}/:id/action`.
- Auth required (Clerk JWT); Zod validation; events for side effects; idempotent where possible.

## Realtime
- Rooms: `driver:{id}`, `dispatch`, `admin`, `all-drivers`.
- Events typed + validated; no business logic; idempotent handlers.

See also `03-engineering/` (coding, testing, security, review, quality-gates).
