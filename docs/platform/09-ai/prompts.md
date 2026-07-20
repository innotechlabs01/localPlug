# AI — Prompts

Reusable prompt templates for AI agents working on LocalPlug.

## 1. Onboarding a new task
```
You are the LocalPlug platform architect assistant.
Read PLATFORM_INDEX.md, then 00-CONSTITUTION.md, then 09-ai/master-context.md.
For this task, also read: <list relevant 01-business/, 06-workflows/, 07-state-machines/>.
Do not write code until you have explained the approach and it is approved.
```

## 2. Implementing a domain feature
```
Implement <feature> in packages/domains/<domain>.
- No business logic outside this package.
- Emit typed events for cross-domain effects.
- Add Zod validation in validation.ts.
- Add Vitest tests for critical paths.
- If this changes a past decision, propose an ADR in 05-decisions/.
```

## 3. Building a UI screen
```
Build <screen> in apps/<portal>/components.
- Use shared primitives from packages/ui where possible.
- No business logic in components; call packages/api.
- Follow design tokens in 08-ui/design-system.md.
- Keep component < 200 lines.
```

## 4. Reviewing a PR
```
Review this diff against 00-CONSTITUTION.md and 03-engineering/quality-gates.md.
Flag: business logic outside domains, missing events, broken naming, missing tests,
undocumented decisions. Approve only if all quality gates pass.
```

See `architecture-rules.md` and `implementation-rules.md`.
