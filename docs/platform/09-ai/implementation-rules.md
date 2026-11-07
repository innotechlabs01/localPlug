# AI — Implementation Rules

How an AI must write code for LocalPlug.

## Process (mandatory)
1. Analyze the existing codebase.
2. Explain what you will do and why.
3. Design the approach; get approval.
4. Only then implement.

## Do NOT
- Write code without explaining why.
- Add dependencies without justification.
- Duplicate business logic.
- Put business rules in React components.
- Access the DB directly from UI.
- Bypass domain or API layers.
- Ignore existing patterns.
- Delete documentation — migrate to `archive/`.

## DO
- Put logic in `packages/domains/*`.
- Validate inputs with Zod.
- Emit typed events for cross-domain effects.
- Use soft deletes for core entities.
- Include error handling.
- Check for existing components/utils first.
- Follow naming conventions (`../10-reference/naming.md`).
- Add tests for critical paths (Vitest/Playwright).
- Document decisions as ADRs in `05-decisions/`.

## Quality gate
Before any file: pass `../03-engineering/quality-gates.md`. Any "no" → stop and propose
the correct approach.
