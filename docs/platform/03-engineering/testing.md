# Engineering — Testing

## Pyramid
```
        ╱╲        E2E (critical paths)
       ╱    ╲
      ╱──────╲   Integration (API, DB)
     ╱          ╲
    ╱────────────╲  Unit (domain logic, utils)
```

## Types
| Type | Scope | Tools | Coverage |
|---|---|---|---|
| Unit | domain logic, utils | Vitest | 80%+ |
| Integration | API routes, DB | Vitest + MSW | critical paths |
| E2E | user workflows | Playwright | happy paths |

## Rules
1. Test behavior, not implementation.
2. Mock external services (Clerk, WhatsApp, n8n).
3. Use factory functions for test data.
4. Each test independent (no shared state).
5. Tests run in CI before merge.

## Where tests live
Domain tests live in `packages/domains/*/__tests__/`. App tests live beside the
component/hook they cover (`*.test.ts`).
