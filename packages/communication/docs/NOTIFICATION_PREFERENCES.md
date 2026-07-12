# NOTIFICATION_PREFERENCES (User Preferences)

> Each user controls which channels they receive notifications on.
> Communication respects these preferences. Domains never check them.

---

## Contract

```typescript
interface NotificationPreferences {
  userId: string
  channels: {
    whatsapp: boolean
    email: boolean
    push: boolean
    sms: boolean
    inApp: boolean
  }
  quietHours?: {
    start: string   // "22:00"
    end: string     // "07:00"
    timezone: string
  }
  language: 'en' | 'es'
}
```

---

## Database Schema

```sql
-- notification_preferences table
CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY,
  whatsapp_enabled INTEGER DEFAULT 1,
  email_enabled INTEGER DEFAULT 1,
  push_enabled INTEGER DEFAULT 1,
  sms_enabled INTEGER DEFAULT 1,
  in_app_enabled INTEGER DEFAULT 1,
  quiet_hours_start TEXT,        -- "22:00"
  quiet_hours_end TEXT,          -- "07:00"
  quiet_hours_timezone TEXT,     -- "America/Santo_Domingo"
  language TEXT DEFAULT 'en',    -- 'en' or 'es'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## Preferences by Recipient Type

### Customer

| Channel | Default | Override |
|---------|---------|----------|
| WhatsApp | ✅ On | Can disable |
| Email | ✅ On | Can disable |
| Push | ✅ On | Can disable |
| SMS | ❌ Off | Can enable |
| InApp | ✅ Always On | Cannot disable |

### Driver

| Channel | Default | Override |
|---------|---------|----------|
| WhatsApp | ✅ On | Can disable |
| Push | ✅ On | Can disable |
| Email | ❌ Off | Can enable |
| SMS | ❌ Off | Can enable |
| InApp | ✅ Always On | Cannot disable |

### Hotel / Partner

| Channel | Default | Override |
|---------|---------|----------|
| Email | ✅ On | Can disable |
| InApp | ✅ Always On | Cannot disable |
| WhatsApp | ❌ Off | Can enable |
| Push | ❌ Off | Can enable |

---

## Quiet Hours

When quiet hours are active:
1. Low priority messages → deferred until quiet hours end
2. Normal priority messages → deferred until quiet hours end
3. High priority messages → delivered anyway
4. Urgent messages → always delivered

Quiet hours are per-user. Each user sets their own timezone and hours.

---

## Preference Resolution

```
1. User has preferences? → Use them
2. No preferences? → Use recipient type defaults
3. No recipient type? → Use global defaults (all channels on)
```

---

## Override Rules

Some events bypass preferences:

| Event | Override | Reason |
|-------|----------|--------|
| `payment.failed` | Force WhatsApp + Email | Financial critical |
| `booking.cancelled` | Force all channels | Service disruption |
| `driver.suspended` | Force WhatsApp + Email | Account critical |
| `health.check.failed` | Admin only, force all | System critical |

Override is logged. User is notified that an override occurred.
