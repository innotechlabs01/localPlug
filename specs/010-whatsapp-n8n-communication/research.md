# Research: WhatsApp n8n Communication

**Date**: 2026-05-19 | **Feature**: 010-whatsapp-n8n-communication

## Research Questions

### 1. Evolution API vs Twilio for WhatsApp

**Decision**: Evolution API (Baileys)

**Rationale**: 
- Free (no per-message costs) vs Twilio ($0.005-0.05 per message)
- Multi-device support (Baileys) — no need for dedicated phone
- Self-hosted on EasyPanel — full control
- Community node available for n8n (`n8n-nodes-evolution-api`)
- No pre-approved template requirement for 24h response window

**Alternatives considered**:
- Twilio WhatsApp Business API: More reliable but expensive at scale; requires pre-approved templates for business-initiated messages
- Official WhatsApp Cloud API: Free tier limited; requires Meta Business verification; complex setup

### 2. Phone Number Format

**Decision**: E.164 format (+573001234567)

**Rationale**:
- Universal standard for WhatsApp message delivery
- Eliminates ambiguity in country code handling
- Evolution API expects E.164 for `number` parameter
- Validation can be done at booking input time

**Alternatives considered**:
- Local format (3001234567): Requires normalization, error-prone
- Auto-detect: Complex logic, unreliable for edge cases

### 3. Webhook Authentication

**Decision**: Header Auth (Bearer token)

**Rationale**:
- Both Evolution API and n8n support this natively
- Simple to implement and debug
- API keys stored in environment variables (not hardcoded)
- Standard pattern for service-to-service communication

**Alternatives considered**:
- HMAC Signature: More secure but complex; overkill for internal services
- IP Whitelisting: Fragile with dynamic IPs; not suitable for cloud deployments

### 4. Data Retention

**Decision**: 30 days for raw events, summaries preserved indefinitely

**Rationale**:
- Raw WhatsApp event payloads are large (full JSON)
- Most debugging needs resolved within first 2 weeks
- 30 days balances storage costs with operational needs
- Summary records (event type, status, timestamp) preserved for audit

**Alternatives considered**:
- Indefinite: Unbounded storage growth
- 90 days: Higher storage cost with diminishing returns

### 5. AI Escalation Detection

**Decision**: Keyword-based detection in n8n + app fallback

**Rationale**:
- n8n processes incoming messages before AI response
- Keywords like "hablar con alguien", "queja", "problema" are clear escalation signals
- App also checks keywords as fallback (defense in depth)
- AI confidence < 0.5 also triggers escalation

**Alternatives considered**:
- Pure AI classification: More flexible but less predictable
- ML model: Overkill for keyword-based detection

### 6. Language Detection

**Decision**: Heuristic-based (booking data + message analysis)

**Rationale**:
- Simple heuristic: check for Spanish characters/names in booking data
- For incoming messages: check for accented characters, common Spanish words
- Fallback: default to Spanish (primary market is Colombia)
- No external API dependency

**Alternatives considered**:
- OpenAI language detection: Adds latency and cost
- Third-party language API: External dependency

## Technical Decisions

### Evolution API Deployment

- **Platform**: EasyPanel (Docker)
- **Image**: `atendai/evolution-api:latest`
- **Database**: PostgreSQL (EasyPanel managed)
- **Cache**: Redis (EasyPanel managed)
- **Domain**: `api-message.innotechlabssas.lat` (Cloudflare proxy)
- **Webhook URL**: `https://agent-ia.innotechlabssas.lat/webhook/evolution-events`

### n8n Workflow Architecture

- **Workflow 1**: Payment → WhatsApp Welcome (1 webhook trigger, 4 nodes)
- **Workflow 2**: WhatsApp → AI Agent → Response (1 webhook trigger, 10+ nodes)
- **Workflow 3**: Status Tracking (1 webhook trigger, 4+ nodes)
- **Shared**: All use same Evolution API credentials, same webhook auth

### App Changes

- **New endpoint**: `POST /api/webhooks/evolution` — receives Evolution API events
- **Updated endpoint**: `POST /api/webhooks/n8n` — handles new event types
- **Updated client**: `lib/n8n/client.ts` — adds `sendWhatsAppDirect()`, `sendWhatsAppButtons()`
- **New migration**: `009_whatsapp_events.sql` — creates `whatsapp_events` table

### Anti-Baneo Strategy

- Start with 50 messages/hour
- Ramp up gradually over 2-3 weeks
- Random delay 3-8 seconds between messages
- Respect user opt-out ("stop", "para", "no")
- Keep conversations natural (not spam)
- Use 24-hour window for free responses
- After 24h, use pre-approved templates only
