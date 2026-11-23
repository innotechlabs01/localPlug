# Engineering — Review Process

## Branch naming
```
feat/driver-portal-registration
fix/assignment-timer-race-condition
refactor/domain-event-bus
docs/api-endpoint-reference
chore/docker-compose-update
```

## Commit messages
```
feat(drivers): add hybrid registration/claim flow

- Phone-based duplicate detection
- OTP verification via WhatsApp
- Clerk user created on verification
- Claim and self-registration paths

Closes #123
```

## PR standards
- One feature/fix per PR.
- Descriptive title and body; link issue.
- Screenshots for UI changes.
- Tests pass before merge.
- No `TODO` comments in merged code.
- CI green (lint, typecheck, tests) before review.

## Review checklist
- Aligns with `../00-CONSTITUTION.md`.
- Business logic in `packages/domains/*`.
- Events emitted for cross-domain effects.
- New decision → ADR in `05-decisions/`.
- Docs updated if behavior changed.
