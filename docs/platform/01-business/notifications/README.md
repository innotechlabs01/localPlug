# Business Domain — Notifications

**Purpose:** Govern push, in-app, and WhatsApp notification rules.

## Entities
- `Notification` — a delivered notification record
- `Template` — message template per channel/locale
- `Channel` — push | in-app | whatsapp

## Events
- `notification:new`, `notification:read`

## Business Rules
- Notifications are triggered by domain events, never by direct calls.
- WhatsApp messages route through Evolution API.
- Templates support EN/ES locales.
- Sensitive data is never included in notification payloads.
- Drivers receive only notifications scoped to them.

## Related
- Workflow: `../../06-workflows/notification-flow.md`
- Domain package: `packages/domains/notifications`
