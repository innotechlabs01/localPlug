# Engineering — Quality Gates

Before creating any file, answer every question. Any "no" → stop, explain, propose
the correct approach.

```
□ Does this duplicate logic?
□ Does this belong to the correct domain?
□ Is there already a shared component?
□ Does this respect the monorepo?
□ Does this break the API?
□ Does this affect realtime?
□ Does this require migration?
□ Is this reusable?
□ Is this documented?
```

## Architecture checklist (before approving implementation)
```
□ Business logic is in packages/domains/*
□ UI only contains presentation logic
□ API routes only orchestrate, not implement
□ Events emitted for cross-domain effects
□ DB schema follows naming conventions
□ Tests cover critical paths
□ No secrets in code
□ No duplicate data storage
```

See `ai-rules.md` and `../09-ai/implementation-rules.md`.
