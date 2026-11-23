# Architecture — Monorepo

LocalPlug is a **Turborepo + pnpm workspaces** monorepo.

```
localplug/
├── apps/
│   ├── admin-portal/      # dispatch & operations (Web)
│   ├── driver-portal/     # driver PWA (mobile-first)
│   ├── customer-portal/   # customer booking (PWA) — planned
│   └── landing/           # public marketing (Web)
├── packages/
│   ├── db/                # Turso + Drizzle schema, migrations
│   ├── auth/              # Clerk + OTP flow, role guards
│   ├── api/               # Next.js App Router route handlers
│   ├── realtime/          # Socket.IO server + client, event bus
│   ├── types/             # shared TS interfaces
│   ├── validation/        # Zod schemas
│   ├── ui/                # shared UI primitives (optional)
│   ├── utils/             # date/string/format helpers
│   ├── config/            # env, feature flags
│   └── domains/           # business logic per domain
│       ├── booking/  dispatch/  drivers/  trips/
│       ├── vehicles/  customers/  payments/
│       ├── notifications/  analytics/  content/
├── infrastructure/        # docker/, docker-compose.yml, terraform/ (future)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Rules
- `packages/*` never import from `apps/*`.
- `packages/domains/*` depend only on `db`, `types`, `validation`.
- `packages/api` orchestrates domains; it does not implement business logic.
- Each domain package exposes a public API via `index.ts`.
- No circular dependencies between packages.

## Application structure
```
apps/driver-portal/
├── app/
│   ├── (auth)/            # login, register, OTP
│   ├── (driver)/          # dashboard, schedule, trip, notifications
│   ├── api/               # app-specific routes (if any)
│   ├── layout.tsx  page.tsx  manifest.json
├── components/  hooks/  lib/  public/  styles/
└── next.config.ts  tailwind.config.ts  tsconfig.json  package.json
```

## Domain package structure
```
packages/domains/drivers/
├── index.ts               # public API exports
├── registration.service.ts
├── claim.service.ts
├── availability.service.ts
├── profile.service.ts
├── compliance.service.ts
├── events.ts
├── types.ts
├── validation.ts
└── __tests__/
```
