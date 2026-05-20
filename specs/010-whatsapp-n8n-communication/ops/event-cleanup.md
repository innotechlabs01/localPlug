# WhatsApp Event Cleanup

**Purpose**: Auto-delete WhatsApp events older than 30 days while preserving summary records

## Retention Policy

- **Raw payloads**: Deleted after 30 days
- **Summary records**: Preserved indefinitely (event_type, status, timestamp)

## Cleanup SQL

Run this query periodically (e.g., daily via cron job):

```sql
-- Delete raw payloads older than 30 days (keep summary fields)
UPDATE whatsapp_events 
SET raw_payload = NULL 
WHERE created_at < datetime('now', '-30 days') 
  AND raw_payload IS NOT NULL;

-- Optional: Delete complete records older than 90 days (aggressive cleanup)
-- Uncomment if storage is a concern
-- DELETE FROM whatsapp_events 
-- WHERE created_at < datetime('now', '-90 days');
```

## Cron Job Setup (Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-whatsapp-events",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Create API route `app/api/cron/cleanup-whatsapp-events/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  
  await db.execute({
    sql: `UPDATE whatsapp_events 
          SET raw_payload = NULL 
          WHERE created_at < datetime('now', '-30 days') 
            AND raw_payload IS NOT NULL`,
    args: [],
  })
  
  return NextResponse.json({ success: true, cleaned: true })
}
```

## Monitoring

Monitor cleanup effectiveness:
- Count total whatsapp_events rows
- Count rows with raw_payload IS NOT NULL
- Track storage usage over time
