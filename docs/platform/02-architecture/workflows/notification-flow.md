# Workflow — Notification Flow

```
Domain event emitted (e.g., assignment:new, trip:status_changed)
      ↓
Notification domain selects channel + template (EN/ES)
      ↓
┌─────────────┬──────────────────┬──────────────────┐
│ In-app      │ Push             │ WhatsApp         │
│ (realtime)  │ (platform)       │ (Evolution API)  │
└─────────────┴──────────────────┴──────────────────┘
      ↓
notification:new  ──► driver room / customer
      ↓
Read → notification:read
```

## Rules
- Notifications triggered by events only, never direct calls.
- WhatsApp via Evolution API; templates support EN/ES.
- No sensitive data in payloads.
- Drivers receive only notifications scoped to them.

## Related
- Domain: `01-business/notifications`
- Channels: `../02-architecture/realtime.md`, `09-ai/`
