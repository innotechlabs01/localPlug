# Engineering — AI Rules

> **This is the canonical "brain" of LocalPlug for AI agents.** All AI behavior
> must start here; `09-ai/` is its focused extension (master-context, prompts,
> architecture-rules, implementation-rules).

These rules govern how AI agents contribute to LocalPlug. They are a strict subset
of `../00-CONSTITUTION.md`.

## Before writing code
1. **Analyze** — understand the existing codebase first.
2. **Explain** — describe what you will do and why.
3. **Design** — show the approach before implementing.
4. **Implement** — only then write code.

## Never do this
- Generate code without explaining why.
- Introduce new dependencies unless justified.
- Duplicate business logic.
- Place business rules inside React components.
- Access the database directly from UI.
- Bypass the domain layer or the API layer.
- Ignore existing patterns.
- Delete documentation — migrate it to `archive/`.

## Always do this
- Document architectural decisions (as ADRs in `05-decisions/`).
- Follow existing code patterns.
- Check for existing components/utils first.
- Validate inputs with Zod schemas.
- Emit events for cross-domain communication.
- Use soft deletes for core entities.
- Include error handling.

## Context loading
AI agents should load only what their task needs:
- `../09-ai/master-context.md` — start here
- `../09-ai/architecture-rules.md`, `../09-ai/implementation-rules.md`
- Relevant `01-business/`, `06-workflows/`, `07-state-machines/` files

Never load the entire repo into context. Use `../PLATFORM_INDEX.md` to navigate.
