# Quickstart: Admin Dashboard with Order Queue & i18n

## What this feature adds

1. **Admin Dashboard** — Stats cards (total, new, in-progress, urgent orders) + recent orders table
2. **Order Queue** — Full filtering by status/priority, search by order number/customer, status tabs with counts
3. **Team Management** — Team member cards with roles, status, assigned order counts
4. **Monthly Agenda** — Timeline view with date picker, activity types (arrival/departure/meeting/task)
5. **i18n Support** — English/Spanish language toggle across all admin pages
6. **RBAC Foundation** — 4 roles, 17 permissions seeded in Turso database
7. **Placeholder Pages** — IA Chat, Intelligence, Logistics, Grid, Dispatch (Coming Soon)

## Key files

| File | Purpose |
|------|---------|
| `app/admin/layout.tsx` | Admin sidebar navigation layout |
| `app/admin/page.tsx` | Dashboard with stats + recent orders |
| `app/admin/orders/page.tsx` | Order queue with filtering/search |
| `app/admin/team/page.tsx` | Team member management |
| `app/admin/agenda/page.tsx` | Monthly agenda timeline |
| `app/admin/*/page.tsx` | Placeholder pages (5 pages) |
| `lib/db.ts` | Turso database client |
| `lib/i18n/index.tsx` | i18n context provider |
| `lib/i18n/locales/en.ts` | English translations |
| `lib/i18n/locales/es.ts` | Spanish translations |
| `app/components/ui/lang-toggle.tsx` | Language toggle component |

## Database tables

| Table | Records | Purpose |
|-------|---------|---------|
| orders | Mock data | Customer orders |
| users | Mock data | Admin/team members |
| roles | 4 seeded | RBAC roles |
| permissions | 17 seeded | Granular permissions |
| role_permissions | Seeded | Role-permission mapping |
| user_roles | Empty | User-role mapping |
| order_status_history | Empty | Status audit trail |
| order_comments | Empty | Order comments |

## Testing

```bash
pnpm test          # Vitest component tests
pnpm lint          # ESLint check
pnpm next build    # Production build
```

## Development

```bash
pnpm dev           # Start dev server
```

Navigate to `http://localhost:3000/admin` to access the admin dashboard.

## i18n

Language toggle is available in the admin header. Switch between 🇺🇸 English and 🇪🇸 Spanish.

All admin text is translated:
- Navigation labels
- Page titles and descriptions
- Status names (new, confirmed, in_progress, etc.)
- Priority names (low, normal, high, urgent)
- Button labels
- Placeholder text

## Design tokens used (consistent with booking/landing)

- Colors: Slate Navy (sidebar), Mountain Emerald (accents), Cool Slate (backgrounds)
- Typography: Plus Jakarta Sans (headlines), Inter (body)
- Spacing: 8px base, 16px/24px/32px stacks
- Radii: 8px default, 12px for cards, 16px for large containers
