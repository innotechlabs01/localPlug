# Engineering — Coding Standards

## TypeScript
- Strict mode (`strict: true`).
- Explicit return types on public functions.
- Avoid `any` — use `unknown` + narrowing.
- Interfaces for object shapes; types for unions/intersections.
- Prefer `readonly` for immutable data.

## React / Next.js
- Functional components only.
- Server Components by default; `'use client'` only when needed.
- Extract complex logic into custom hooks.
- Components under 200 lines; one component per file.

## File organization
```
ComponentName/
├── index.ts
├── ComponentName.tsx
├── ComponentName.test.ts
└── types.ts (if needed)
```

## Import order
```typescript
// 1. React/Next
import { useState } from 'react';
// 2. External
import { z } from 'zod';
// 3. Shared packages
import { db } from '@localplug/db';
import { requireAuth } from '@localplug/auth';
// 4. Domain services
import { registerDriver } from '@localplug/domains/drivers';
// 5. Local components
import { DriverForm } from './components/DriverForm';
// 6. Local utils
import { formatPhone } from './utils';
```

## Comments
- No comments unless explicitly requested.
- Code should be self-documenting.
- Complex algorithms get brief explanatory comments.

See `../10-reference/naming.md` for full naming conventions.
