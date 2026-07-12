# CASES DOMAIN

> Case management, escalations, and issue resolution.

## Responsibility
- Owns: cases, escalations, issue resolution, case assignments
- Does NOT own: chat conversations (Chat), ratings (Ratings)

## Boundaries
- Inbound: Chat (escalation), Admin, Customer app
- Outbound: Notifications (case updates), Analytics (metrics)

## Status
- Maturity: 22%
- Extraction: Not started (4 tables, 4 API routes)
- Portal: None

## Domain Model
- **Entities**: Case, CaseComment, CaseAssignment, CaseEscalation
- **Value Objects**: CaseStatus, CasePriority, CaseType, EscalationLevel
- **Aggregates**: Case (root: Case, invariants: status transitions, assignment rules)
- **Events**: case.created, case.assigned, case.escalated, case.resolved
- **Policies**: Escalation rules, assignment rules, SLA rules

## Key Files
- `app/api/cases/` — 4 API routes (needs extraction)
- `app/admin/cases/[id]/` — 1 detail page (273L)
- `packages/db/src/domains/cases/` — 4 tables

## Extraction Plan
1. Create Cases domain package
2. Extract from API routes
3. Add case events
