# CASES DOMAIN

> Case management, escalations, and issue resolution.

## Responsibility
- Owns: cases, escalations, issue resolution, case assignments, SLA tracking
- Does NOT own: chat conversations (Chat), ratings (Ratings), notifications (Communication)

## Boundaries
- Inbound: Chat (escalation), Admin, Customer app
- Outbound: Notifications (case updates), Analytics (metrics)

## Status
- Stage: Capability (not yet extracted)
- Maturity: 22%
- Extraction: Not started

## Domain Model
- Entities: Case, CaseComment, CaseAssignment, CaseEscalation
- Value Objects: CaseStatus, CasePriority, CaseType, EscalationLevel
- Aggregates: Case (root, invariants: status transitions, SLA rules)
- Events: case.opened, case.assigned, case.escalated, case.resolved
- Policies: EscalationPolicy, AssignmentPolicy, SLAPolicy, ResolutionPolicy
