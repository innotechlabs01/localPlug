# FOLDER_OWNERSHIP

Where every current top-level folder goes in the target monorepo. (Per-file detail in
`FILE_CLASSIFICATION.md`.)

| Current folder | Target | Action | Epic |
|---|---|---|---|
| `app/admin/*` | `apps/admin/app/admin/*` (UI) | Move + Split logic to domains | 5 |
| `app/api/*` | `apps/admin/app/api/*` (thin) + `packages/domains/*` (logic) | Split / Move | 2C/3 |
| `app/booking/*` | `apps/customer/app/booking/*` | Move + Split | 7 |
| `app/components/booking/*` | `apps/customer/components/booking/*` + `domains/booking` + `packages/ui` | Split | 7 |
| `app/components/chat/*` | `apps/admin/components/chat/*` + `domains/chat` | Split | 5 |
| `app/components/concierge/*` | `apps/landing/components/concierge/*` | Move | 6 |
| `app/components/ratings/*` | `packages/ui` + `domains/ratings` | Split | 4 |
| `app/components/ui/*` | `packages/ui` | Move | 4 |
| `app/components/{hero,pricing,experiences,how-it-works,testimonials,stats,cta,about,layout}/*` | `apps/landing/components/*` | Move | 6 |
| `app/components/admin/*` | `apps/admin/components/*` | Move | 5 |
| `app/hooks/*` | `apps/landing` | Move | 6 |
| `app/page.tsx` + public shell | `apps/landing` | Move | 6 |
| `app/sign-in`, `app/reset-password` | `apps/admin` (auth shell) | Move | 5 |
| `lib/db*` | `packages/db` | Replace / Merge / Move | 4 |
| `lib/admin/*` | `packages/auth` (+ `apps/admin` for UI contexts) | Move / Replace | 4/5 |
| `lib/config.ts`, `lib/pricing.ts` | `packages/config` | Move / Merge | 4 |
| `lib/dispatch/*` | `packages/domains/dispatch` | Move | 3 |
| `lib/services/*` | `packages/domains/<d>` | Move / Split | 3 |
| `lib/n8n/*`, `lib/queue/*`, `lib/whatsapp-event.ts` | `packages/domains/notifications` + `packages/realtime` | Split / Move | 3/4 |
| `lib/conversation.ts`, `lib/moderation/*` | `packages/domains/chat` / `moderation` | Move | 3 |
| `lib/paddle/*`, `lib/payment-record.ts` | `packages/domains/payments` | Move / Delete(dup) | 3 |
| `lib/reservations-*` | `apps/admin/lib` + `domains/booking` | Move / Split | 5/3 |
| `lib/webhook-auth.ts` | `packages/auth` | Move | 4 |
| `lib/i18n/*`, `lib/{logger,date-utils,phone-utils,string-utils,countries,language-utils,message,rate-limit}.ts`, `lib/resilience/*` | `packages/shared` | Move | 4 |
| `lib/design-tokens.ts` | `packages/ui` | Move | 4 |
| `scripts/*` | `packages/db/scripts`, `packages/auth/scripts` | Move | 4 |
| `middleware.ts` | `packages/auth` | Move | 4 |
| `n8n/*` | (n8n infra, outside monorepo) | Keep | - |
| Root configs (`package.json`, `tsconfig`, `next.config`, `tailwind`, `eslint`, `vercel`, `vitest`, `postcss`) | monorepo workspace root (+ per-app configs) | Keep | - |

See `DEPENDENCY_GRAPH.md` for allowed import directions after the move.
