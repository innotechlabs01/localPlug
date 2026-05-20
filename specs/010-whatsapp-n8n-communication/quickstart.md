# Quickstart: WhatsApp n8n Communication

**Date**: 2026-05-19 | **Feature**: 010-whatsapp-n8n-communication

## Prerequisites

- [ ] EasyPanel account with Docker support
- [ ] n8n instance running at `https://agent-ia.innotechlabssas.lat`
- [ ] Cloudflare DNS access for `innotechlabssas.lat`
- [ ] OpenAI API key with GPT-4o access
- [ ] Stripe test mode keys configured
- [ ] Turso database with migrations applied

## Step 1: Deploy Evolution API on EasyPanel

1. Create EasyPanel project: `localplug-whatsapp`
2. Add PostgreSQL database: `evolution-db`
3. Add Redis cache: `evolution-redis`
4. Deploy Evolution API Docker container
5. Configure environment variables (see `SETUP-GUIDE.md` Part 1)
6. Expose port 8080
7. Configure Cloudflare DNS: `api-message.innotechlabssas.lat`
8. Create WhatsApp instance: `localplug-main`
9. Scan QR code with WhatsApp
10. Configure anti-baneo settings

## Step 2: Configure n8n

1. Create API key in n8n Settings → API
2. Install Evolution API community node
3. Add Evolution API credentials
4. Add OpenAI credentials

## Step 3: Create n8n Workflows

1. **Workflow 1**: Payment → WhatsApp Welcome
   - Webhook: `POST /webhook/payment-confirmed`
   - Nodes: Webhook → Code → Evolution API → HTTP Request
   - Activate workflow

2. **Workflow 2**: WhatsApp → AI Agent
   - Webhook: `POST /webhook/evolution-events`
   - Nodes: Webhook → IF → IF → Code → OpenAI → IF → (Escalation | Response) → HTTP Request
   - Activate workflow

3. **Workflow 3**: Status Tracking
   - Webhook: `POST /webhook/evolution-events`
   - Nodes: Webhook → Switch → Code (×3)
   - Activate workflow

## Step 4: Apply Database Migration

Run migration `009_whatsapp_events.sql` on Turso:

```sql
ALTER TABLE conversations ADD COLUMN whatsapp_instance TEXT;
ALTER TABLE conversations ADD COLUMN whatsapp_message_id TEXT;

CREATE TABLE IF NOT EXISTS whatsapp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  event_type TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  message_id TEXT,
  from_me INTEGER NOT NULL DEFAULT 0,
  content TEXT,
  message_type TEXT,
  status TEXT,
  participant TEXT,
  raw_payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_events_conversation_id ON whatsapp_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_remote_jid ON whatsapp_events(remote_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_event_type ON whatsapp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_instance ON whatsapp_events(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_created_at ON whatsapp_events(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_instance ON conversations(whatsapp_instance);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
```

## Step 5: Set Environment Variables

Add to `.env.local` and Vercel:

```env
# Evolution API
EVOLUTION_API_URL=https://api-message.innotechlabssas.lat
EVOLUTION_API_KEY=<your-key>
EVOLUTION_INSTANCE_NAME=localplug-main

# n8n
N8N_BASE_URL=https://agent-ia.innotechlabssas.lat
N8N_API_KEY=<your-key>

# OpenAI
OPENAI_API_KEY=sk-...
```

## Step 6: Test End-to-End

### Test 1: Payment → WhatsApp
1. Complete a test booking
2. Complete Stripe payment
3. Verify WhatsApp welcome message received

### Test 2: User Message → AI Response
1. Send "hola" to business WhatsApp
2. Verify AI responds in Spanish
3. Send "hello" to business WhatsApp
4. Verify AI responds in English

### Test 3: Escalation
1. Send "hablar con alguien"
2. Verify escalation message received
3. Verify conversation appears as "Escalated" in admin

### Test 4: Admin Takeover
1. Open admin IA Chat Center
2. Select WhatsApp conversation
3. Click "Take Over"
4. Send manual message
5. Verify user receives it
6. Click "AI Mode"
7. Verify AI resumes

## Step 7: Deploy

1. Commit all changes
2. Push to feature branch
3. Vercel auto-deploys preview
4. Test on preview URL
5. Merge to main
6. Vercel auto-deploys to production

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WhatsApp not connecting | Re-scan QR code in Evolution API Manager |
| Messages not sending | Check phone number format (E.164) |
| AI not responding | Verify OpenAI API key in n8n |
| Webhook 401 error | Check API key matches in both services |
| Duplicate messages | Check conversation status in DB |
