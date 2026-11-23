# Architecture — Packages

| Package | Type | Purpose | Consumers |
|---|---|---|---|
| `packages/db` | Infra | Turso + Drizzle, migrations | domains, api |
| `packages/auth` | Infra | Clerk sessions, OTP, role guards | api, apps |
| `packages/api` | Infra | App Router handlers | apps |
| `packages/realtime` | Infra | Socket.IO server + client | apps, domains |
| `packages/types` | Shared | TS interfaces | all |
| `packages/validation` | Shared | Zod schemas | domains, api |
| `packages/utils` | Shared | date/string/format | all |
| `packages/config` | Shared | env, feature flags | all |
| `packages/ui` | Shared | UI primitives (optional) | apps |
| `packages/domains/*` | Business | per-domain logic | api, apps |

## Rules
1. Packages never import from `apps/*`.
2. Clear, singular responsibility each.
3. Public API via `index.ts`.
4. Dependencies flow downward only.
5. No circular dependencies.

## Interface pattern
```typescript
// packages/domains/drivers/index.ts
export { registerDriver } from './registration.service';
export { claimDriver } from './claim.service';
export { updateAvailability } from './availability.service';
export type { Driver, DriverStatus, AvailabilityStatus } from '@localplug/types';
```
