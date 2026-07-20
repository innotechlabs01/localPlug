# Architecture — Applications

| Application | User | Framework | Delivery | Status |
|---|---|---|---|---|
| Admin Portal | Dispatchers, Managers | Next.js 15 | Web | Active |
| Driver Portal | Drivers | Next.js 15 | PWA | Building |
| Customer Portal | Travelers | Next.js 15 | PWA | Planned |
| Landing | Public | Next.js 15 | Web | Active |

## Independence
Each application:
- Has its own `package.json` and dependencies
- Can be deployed independently
- Has its own UI components and hooks
- Shares business logic via `packages/domains`
- Shares infrastructure via `packages/*`

## Rules
1. Applications never contain business logic.
2. Applications never access the database directly.
3. Applications consume `packages/api` for data operations.
4. Applications consume `packages/realtime` for live updates.
5. App-specific UI is allowed; app-specific business logic is not.

See `monorepo.md` for directory structure.
