# Workflow: WhatsApp → AI Agent

**Purpose**: Process incoming WhatsApp messages with AI and respond

## Webhook Trigger

- **Path**: `/webhook/evolution-events`
- **Method**: POST
- **Auth**: Header Auth (Bearer token)

## Workflow Nodes

```
1. Webhook (evolution-events)
   ↓
2. IF: Is Incoming Message? (event == "messages.upsert")
   ↓
3. IF: Not From Me? (fromMe == false)
   ↓
4. Code: Extract Message Data
   ↓
5. OpenAI: Generate Response
   ↓
6. IF: Needs Escalation?
   ├→ TRUE: Notify App + Send Escalation Message
   └→ FALSE: Format Response + Send via Evolution API + Save to DB
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

## Node 2: Is Incoming Message? (IF)

```json
{
  "conditions": {
    "string": [
      {
        "value1": "={{ $json.event }}",
        "operation": "equal",
        "value2": "messages.upsert"
      }
    ]
  }
}
```

## Node 3: Not From Me? (IF)

```json
{
  "conditions": {
    "boolean": [
      {
        "value1": "={{ $json.data.key.fromMe }}",
        "operation": "equal",
        "value2": false
      }
    ]
  }
}
```

## Node 4: Extract Message Data (Code)

```javascript
const data = $input.first().json.data;
const phone = data.key.remoteJid.replace(/@s\.whatsapp\.net$/, '');
const message = data.message?.conversation || 
                data.message?.extendedTextMessage?.text || '';
const instance = $input.first().json.instance;

if (!message) {
  return [];
}

return [{
  json: {
    phone: phone,
    message: message,
    instance: instance,
    pushName: data.pushName || phone,
    messageId: data.key.id
  }
}];
```

## Node 5: OpenAI Generate Response

```json
{
  "resource": "openAi",
  "operation": "message",
  "model": "gpt-4o",
  "messages": {
    "values": [
      {
        "role": "system",
        "content": "Eres el asistente virtual de Medellín Premium..."
      },
      {
        "role": "user",
        "content": "={{ $json.message }}"
      }
    ]
  },
  "options": {
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

## Node 6: Needs Escalation? (IF)

```json
{
  "conditions": {
    "string": [
      {
        "value1": "={{ $json.choices[0].message.content }}",
        "operation": "contains",
        "value2": "agente se pondrá en contacto"
      }
    ]
  }
}
```

## Node 7A: Notify App - Escalation (HTTP Request)

```json
{
  "method": "POST",
  "url": "https://localplug.vercel.app/api/webhooks/n8n",
  "sendBody": true,
  "bodyParameters": {
    "event": "whatsapp-escalation",
    "data": {
      "conversationId": 0,
      "reason": "User requested human agent",
      "phone": "={{ $('Extract Message Data').item.json.phone }}"
    }
  }
}
```

## Node 7B: Send Escalation Message (Evolution API)

```json
{
  "resource": "evolutionApi",
  "operation": "sendText",
  "instance": "localplug-main",
  "number": "={{ $('Extract Message Data').item.json.phone }}",
  "text": "Un agente se pondrá en contacto contigo en breve. ⏳"
}
```

## Node 8A: Format AI Response (Code)

```javascript
const aiResponse = $input.first().json.choices[0].message.content;
const phone = $('Extract Message Data').item.json.phone;

return [{
  json: {
    phone: phone,
    message: aiResponse,
    instance: $('Extract Message Data').item.json.instance
  }
}];
```

## Node 8B: Send AI Response (Evolution API)

```json
{
  "resource": "evolutionApi",
  "operation": "sendText",
  "instance": "localplug-main",
  "number": "={{ $json.phone }}",
  "text": "={{ $json.message }}"
}
```

## Node 9: Save to App DB (HTTP Request)

```json
{
  "method": "POST",
  "url": "https://localplug.vercel.app/api/webhooks/n8n",
  "sendBody": true,
  "bodyParameters": {
    "event": "whatsapp-ai-response",
    "data": {
      "conversationId": 0,
      "message": "={{ $json.message }}",
      "confidence": 0.95
    }
  }
}
```

## Test Payload

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
      "conversation": "Hola, tengo una pregunta sobre mi reserva"
    },
    "pushName": "Juan Pérez",
    "messageTimestamp": 1716120000
  }
}
```
