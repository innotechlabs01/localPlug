# Workflow: Status Tracking

**Purpose**: Track WhatsApp message delivery status and instance health

## Webhook Trigger

- **Path**: `/webhook/evolution-events`
- **Method**: POST
- **Auth**: Header Auth (Bearer token)

## Workflow Nodes

```
1. Webhook (evolution-events)
   ↓
2. Switch: Route by Event Type
   ├→ message-receipt.update → Log Delivery Status
   ├→ instance.status → Log Instance Health
   ├→ connection.update → Alert if Disconnected
   └→ Default → No-op
```

## Node 1: Webhook

```json
{
  "httpMethod": "POST",
  "path": "evolution-events",
  "authentication": "headerAuth",
  "responseMode": "onReceived"
}
```

## Node 2: Route by Event Type (Switch)

```json
{
  "rules": {
    "rules": [
      {
        "value": "message-receipt.update"
      },
      {
        "value": "instance.status"
      },
      {
        "value": "connection.update"
      }
    ]
  }
}
```

## Node 3A: Log Delivery Status (Code)

```javascript
const data = $input.first().json.data;
console.log(`[WhatsApp Status] Message ${data.key?.id}: ${data.status}`);
return [{ json: { logged: true, event: 'receipt', status: data.status } }];
```

## Node 3B: Log Instance Health (Code)

```javascript
const data = $input.first().json.data;
console.log(`[WhatsApp Status] Instance: ${data.status}`);
return [{ json: { logged: true, event: 'instance', status: data.status } }];
```

## Node 3C: Alert if Disconnected (Code)

```javascript
const data = $input.first().json.data;
console.log(`[WhatsApp Status] Connection: ${data.state}`);
if (data.state === 'close') {
  console.error('[WhatsApp ALERT] Instance disconnected!');
}
return [{ json: { logged: true, event: 'connection', state: data.state } }];
```

## Test Payloads

### message-receipt.update
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

### instance.status
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

### connection.update
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
