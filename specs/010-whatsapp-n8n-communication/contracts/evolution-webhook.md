# Evolution API Webhook Contract

**Endpoint**: `POST /api/webhooks/evolution`
**Purpose**: Receive events from Evolution API (WhatsApp messages, delivery status, instance health)

## Authentication

Header: `Authorization: Bearer <EVOLUTION_API_KEY>`

## Request Format

All events follow this structure:

```json
{
  "event": "string",
  "instance": "string",
  "data": { }
}
```

## Event Types

### messages.upsert

Incoming or outgoing WhatsApp message.

```json
{
  "event": "messages.upsert",
  "instance": "localplug-main",
  "data": {
    "key": {
      "remoteJid": "573001234567@s.whatsapp.net",
      "fromMe": false,
      "id": "ABCDEF123456"
    },
    "message": {
      "conversation": "Hola, tengo una pregunta"
    },
    "pushName": "Juan Pérez",
    "messageTimestamp": 1716120000,
    "participant": null
  }
}
```

**Processing Logic**:
1. Extract phone number from `key.remoteJid` (remove `@s.whatsapp.net`)
2. If `key.fromMe` is true → log only, do not process
3. If `key.fromMe` is false → process as incoming message
4. Find or create conversation by phone number
5. Store message in `messages` table
6. If conversation status is `ai_active` → trigger n8n AI processing

### message-receipt.update

Delivery status change for a sent message.

```json
{
  "event": "message-receipt.update",
  "instance": "localplug-main",
  "data": {
    "key": {
      "remoteJid": "573001234567@s.whatsapp.net",
      "id": "ABCDEF123456"
    },
    "status": "delivered"
  }
}
```

**Processing Logic**: Update message delivery status in `whatsapp_events` table.

### instance.status

Instance health status change.

```json
{
  "event": "instance.status",
  "instance": "localplug-main",
  "data": {
    "instanceName": "localplug-main",
    "status": "open"
  }
}
```

**Processing Logic**: Log instance status for monitoring.

### connection.update

Connection state change.

```json
{
  "event": "connection.update",
  "instance": "localplug-main",
  "data": {
    "state": "open",
    "reason": "logged_in"
  }
}
```

**Processing Logic**: Log connection state. Alert if state is `close`.

## Response Format

```json
{
  "success": true,
  "processed": "event-name"
}
```

## Error Response

```json
{
  "error": "Webhook processing failed"
}
```

Status: 500
