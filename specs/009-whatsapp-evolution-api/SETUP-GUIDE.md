# Evolution API + n8n + WhatsApp: Setup Guide

**Date**: 2026-05-19 | **Feature**: 009-whatsapp-evolution-api

## Overview

This guide covers the complete setup for WhatsApp communication using:
- **Evolution API**: WhatsApp Multi-Device bridge (Baileys)
- **n8n**: Workflow automation
- **OpenAI GPT-4o**: AI agent for automated responses
- **Cloudflare**: DNS and proxy for `api-message.innotechlabssas.lat`

---

## Part 1: Evolution API on EasyPanel

### Step 1: Create EasyPanel Project

1. Go to [EasyPanel](https://easypanel.io)
2. Click **New Project**
3. Name: `localplug-whatsapp`
4. Click **Create**

### Step 2: Add PostgreSQL Database

1. In your project, click **New Service** → **Database** → **PostgreSQL**
2. Name: `evolution-db`
3. Note the connection details (you'll need them later):
   - Host: `evolution-db` (internal name)
   - Port: `5432`
   - Database: `evolution`
   - User: `postgres`
   - Password: (auto-generated, copy it)

### Step 3: Add Redis Cache

1. Click **New Service** → **Database** → **Redis**
2. Name: `evolution-redis`
3. Note the connection URI: `redis://:password@evolution-redis:6379`

### Step 4: Deploy Evolution API

1. Click **New Service** → **Docker**
2. Name: `evolution-api`
3. Image: `atendai/evolution-api:latest`
4. Port: `8080`
5. Click **Deploy**

### Step 5: Configure Environment Variables

Go to `evolution-api` → **Settings** → **Environment** and add:

```env
# Server Configuration
SERVER_URL=https://api-message.innotechlabssas.lat
SERVER_PORT=8080
SERVER_TYPE=http

# Authentication (generate a secure API key)
AUTHENTICATION_API_KEY=evo_k1_localplug_2026_secure_key_here
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCE=true

# Database (use EasyPanel internal names)
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:YOUR_PASSWORD@evolution-db:5432/evolution

# Cache (Redis)
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://:YOUR_PASSWORD@evolution-redis:6379

# Webhooks - Send ALL events to the App (App Direct Architecture)
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://localplug.vercel.app/api/webhooks/evolution
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
WEBHOOK_GLOBAL_HEADERS={"x-evolution-signature":"YOUR_EVOLUTION_WEBHOOK_SECRET"}

# Instance Settings
CONFIG_SESSION_PHONE_NUMBER=573001234567
CONFIG_SESSION_PHONE_CODE=57
CONFIG_SESSION_PHONE_CODE_DISCONNECT=false

# Logging
LOG_LEVEL=WARN,SHELL,WEBHOOK,WEBHOOK_BY_EVENTS
```

**IMPORTANT**: Replace:
- `YOUR_PASSWORD` with the PostgreSQL password from Step 2
- `YOUR_PASSWORD` with the Redis password from Step 3
- `YOUR_EVOLUTION_WEBHOOK_SECRET` with a secure secret (must match EVOLUTION_WEBHOOK_SECRET in Vercel)
- `573001234567` with your actual WhatsApp Business number

### Step 6: Expose Port and Configure Domain

1. In EasyPanel, go to `evolution-api` → **Settings** → **Networking**
2. Expose port `8080` as HTTP
3. Note the EasyPanel URL: `https://evolution-api-xxxxx.easypanel.host`

### Step 7: Configure Cloudflare DNS

1. Go to Cloudflare Dashboard → Select `innotechlabssas.lat` zone
2. Go to **DNS** → **Records**
3. Click **Add Record**:
   - Type: `CNAME`
   - Name: `api-message`
   - Target: `evolution-api-xxxxx.easypanel.host`
   - Proxy status: **Proxied** (orange cloud)
   - Click **Save**

4. Wait 1-2 minutes for DNS propagation

5. Test: `curl https://api-message.innotechlabssas.lat/manager`

### Step 8: Create WhatsApp Instance

1. Open Evolution API Manager: `https://api-message.innotechlabssas.lat/manager`
2. Login with your `AUTHENTICATION_API_KEY`
3. Click **New Instance**
4. Fill in:
   - Instance Name: `localplug-main`
   - Emission: `Baileys`
   - Webhook: Enable (inherits global settings)
5. Click **Create**
6. Click **Connect** → QR Code appears
7. Open WhatsApp on your phone → **Linked Devices** → **Link a Device**
8. Scan the QR code
9. Wait for status: `open` (connected)

### Step 9: Configure Anti-Baneo Settings

In the Evolution API Manager → Instance Settings → Edit:

```json
{
  "reject_call": true,
  "groups_ignore": true,
  "always_online": true,
  "read_messages": true,
  "read_status": true,
  "sync_full_history": false,
  "retries": 3
}
```

**Anti-Baneo Rules**:
- Max 50 messages/hour initially (ramp up over 2-3 weeks)
- Random delay 3-8 seconds between messages
- Don't send to non-WhatsApp numbers
- Respect "stop"/"para"/"no" from users
- Keep conversations natural (not spam)
- Use 24-hour window for free responses
- After 24h, use pre-approved templates only

---

## Part 2: n8n Setup

### Step 1: Access n8n

1. Go to: `https://agent-ia.innotechlabssas.lat`
2. Login with your n8n credentials

### Step 2: Create API Key (for Evolution API webhook auth)

1. Go to **Settings** → **API**
2. Click **Create API Key**
3. Name: `evolution-webhook`
4. Copy the key (you'll use it in Evolution API webhook headers)

### Step 3: Install Evolution API Community Node

1. Go to **Settings** → **Community Nodes**
2. Search: `n8n-nodes-evolution-api`
3. Click **Install**
4. Wait for installation to complete

### Step 4: Add Evolution API Credentials

1. Go to **Settings** → **Credentials**
2. Click **Add Credential**
3. Search: `Evolution API`
4. Fill in:
   - Name: `Evolution API - LocalPlug`
   - API URL: `https://api-message.innotechlabssas.lat`
   - API Key: `evo_k1_localplug_2026_secure_key_here`
5. Click **Save**

### Step 5: Add OpenAI Credentials

1. Go to **Settings** → **Credentials**
2. Click **Add Credential**
3. Search: `OpenAI`
4. Fill in:
   - Name: `OpenAI - GPT4o`
   - API Key: `sk-...` (your OpenAI API key)
5. Click **Save**

---

## Part 3: n8n Workflows

### Workflow 1: Payment Confirmation → WhatsApp

**Purpose**: When a user pays, send them a WhatsApp welcome message.

#### Step 1: Create New Workflow

1. Click **New Workflow**
2. Name: `Payment → WhatsApp Welcome`
3. Click **Save**

#### Step 2: Add Webhook Trigger

1. Click **+** → Search `Webhook`
2. Add **Webhook** node
3. Configure:
   - HTTP Method: `POST`
   - Path: `payment-confirmed`
   - Authentication: `Header Auth`
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_N8N_API_KEY`
4. Click **Listen for test event**

#### Step 3: Add Function Node (Format Message)

1. Click **+** after Webhook → Search `Code`
2. Add **Code** node
3. Name: `Format Welcome Message`
4. Code:

```javascript
const booking = $input.first().json.data.booking;
const phone = booking.customerPhone;
const name = booking.customerName;
const ref = booking.bookingReference;
const pkg = booking.packageName;
const arrival = booking.arrivalDate;
const flight = booking.flightNumber;

// Auto-detect language (simple heuristic)
const isSpanish = /[áéíóúñ¿¡]/.test(name) || 
                  name.toLowerCase().includes('maría') ||
                  name.toLowerCase().includes('josé');

const message = isSpanish 
  ? `¡Hola ${name}! 🎉\n\nTu reserva *#${ref.slice(0, 8).toUpperCase()}* está confirmada.\n\n📦 Paquete: ${pkg}\n✈️ Vuelo: ${flight}\n📅 Llegada: ${arrival}\n\n¿Tienes alguna pregunta? Responde a este mensaje y te ayudamos.`
  : `Hello ${name}! 🎉\n\nYour booking *#${ref.slice(0, 8).toUpperCase()}* is confirmed.\n\n📦 Package: ${pkg}\n✈️ Flight: ${flight}\n📅 Arrival: ${arrival}\n\nDo you have any questions? Reply to this message and we'll help you.`;

return [{
  json: {
    phone: phone,
    message: message,
    instance: 'localplug-main'
  }
}];
```

5. Click **Save**

#### Step 4: Add Evolution API Send Text

1. Click **+** after Code → Search `Evolution API`
2. Add **Evolution API** node
3. Select credential: `Evolution API - LocalPlug`
4. Operation: `Send Text`
5. Configure:
   - Instance Name: `localplug-main`
   - Phone Number: `{{ $json.phone }}`
   - Text: `{{ $json.message }}`
6. Click **Save**

#### Step 5: Add Webhook Callback to App

1. Click **+** after Evolution API → Search `HTTP Request`
2. Add **HTTP Request** node
3. Name: `Callback to App`
4. Configure:
   - Method: `POST`
   - URL: `https://localplug.vercel.app/api/webhooks/n8n`
   - Body Content Type: `JSON`
   - Body:
     ```json
     {
       "event": "whatsapp-sent",
       "data": {
         "bookingReference": "{{ $('Format Welcome Message').item.json.phone }}",
         "whatsappMessageId": "{{ $json.key?.id }}",
         "status": "sent"
       },
       "timestamp": "{{ $now.toISO() }}"
     }
     ```
5. Click **Save**

#### Step 6: Test Workflow

1. Click **Test workflow**
2. In Webhook node, click **Listen for test event**
3. Send test payload:

```json
{
  "event": "payment-confirmed",
  "data": {
    "booking": {
      "bookingReference": "test-123-abc",
      "customerName": "Juan Pérez",
      "customerEmail": "juan@test.com",
      "customerPhone": "573001234567",
      "packageName": "The VIP Arrival",
      "amount": 89,
      "flightNumber": "AV123",
      "airline": "Avianca",
      "arrivalDate": "2026-06-15",
      "arrivalTime": "14:30"
    }
  },
  "timestamp": "2026-05-19T10:00:00.000Z"
}
```

4. Verify: WhatsApp message received on phone

#### Step 7: Activate Workflow

1. Click **Active** toggle (top right)
2. Workflow is now live

---

### Workflow 2: Incoming WhatsApp → AI Agent → Response

**Purpose**: When a user sends a WhatsApp message, process with AI and respond.

#### Step 1: Create New Workflow

1. Click **New Workflow**
2. Name: `WhatsApp → AI Agent`
3. Click **Save**

#### Step 2: Add Webhook Trigger

1. Click **+** → Search `Webhook`
2. Add **Webhook** node
3. Configure:
   - HTTP Method: `POST`
   - Path: `evolution-events`
   - Authentication: `Header Auth`
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_N8N_API_KEY`
4. Click **Listen for test event**

#### Step 3: Add IF Node (Filter incoming messages)

1. Click **+** after Webhook → Search `IF`
2. Add **IF** node
3. Name: `Is Incoming Message?`
4. Condition:
   - Value 1: `{{ $json.event }}`
   - Operation: `Equal`
   - Value 2: `messages.upsert`
5. Click **Save**

#### Step 4: Add IF Node (Not from me)

1. Click **+** after IF (True branch) → Search `IF`
2. Add **IF** node
3. Name: `Not From Me?`
4. Condition:
   - Value 1: `{{ $json.data.key.fromMe }}`
   - Operation: `Equal`
   - Value 2: `false`
5. Click **Save**

#### Step 5: Add Function Node (Extract Data)

1. Click **+** after IF (True branch) → Search `Code`
2. Add **Code** node
3. Name: `Extract Message Data`
4. Code:

```javascript
const data = $input.first().json.data;
const phone = data.key.remoteJid.replace(/@s\.whatsapp\.net$/, '');
const message = data.message?.conversation || 
                data.message?.extendedTextMessage?.text || '';
const instance = $input.first().json.instance;

if (!message) {
  return []; // Skip non-text messages
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

5. Click **Save**

#### Step 6: Add OpenAI Node

1. Click **+** after Extract Data → Search `OpenAI`
2. Add **OpenAI** node
3. Select credential: `OpenAI - GPT4o`
4. Operation: `Message`
5. Configure:
   - Model: `gpt-4o`
   - Messages:
     - System:
       ```
       Eres el asistente virtual de Medellín Premium, un servicio de concierge premium para viajeros que llegan a Medellín, Colombia.

       Tu trabajo es:
       1. Ayudar con información sobre reservas, paquetes, y servicios
       2. Responder preguntas sobre Medellín, aeropuerto, transporte
       3. Guiar al usuario a través del proceso de reserva
       4. Resolver dudas post-pago

       Reglas:
       - Responde en el MISMO idioma que el usuario (detecta automáticamente)
       - Sé breve, amable y profesional
       - Usa emojis con moderación
       - Si no sabes algo, di "Un agente se pondrá en contacto contigo pronto"
       - Si el usuario dice "hablar con alguien", "queja", "problema", o similar, responde confirmando que un agente lo contactará

       Paquetes disponibles:
       - The VIP Arrival ($89): Traslado privado + welcome package
       - The 24h Insider ($149): VIP + hotel + city tour
       - The Peace of Mind ($249): VIP + hotel + city tour + personal concierge 24h
       ```
     - User: `{{ $json.message }}`
   - Options:
     - Temperature: `0.7`
     - Max Tokens: `500`
6. Click **Save**

#### Step 7: Add IF Node (Check Escalation)

1. Click **+** after OpenAI → Search `IF`
2. Add **IF** node
3. Name: `Needs Escalation?`
4. Condition:
   - Value 1: `{{ $json.choices[0].message.content }}`
   - Operation: `Contains`
   - Value 2: `agente se pondrá en contacto`
5. Click **Save**

#### Step 8A: Escalation Path (True branch)

1. Click **+** after IF (True branch) → Search `HTTP Request`
2. Add **HTTP Request** node
3. Name: `Notify App - Escalation`
4. Configure:
   - Method: `POST`
   - URL: `https://localplug.vercel.app/api/webhooks/n8n`
   - Body:
     ```json
     {
       "event": "whatsapp-escalation",
       "data": {
         "conversationId": 0,
         "reason": "User requested human agent",
         "phone": "{{ $('Extract Message Data').item.json.phone }}"
       },
       "timestamp": "{{ $now.toISO() }}"
     }
     ```
5. Click **Save**

6. Click **+** after HTTP Request → Search `Evolution API`
7. Add **Evolution API** node
8. Configure:
   - Instance Name: `localplug-main`
   - Phone Number: `{{ $('Extract Message Data').item.json.phone }}`
   - Text: `Un agente se pondrá en contacto contigo en breve. ⏳`
9. Click **Save**

#### Step 8B: Normal AI Response (False branch)

1. Click **+** after IF (False branch) → Search `Code`
2. Add **Code** node
3. Name: `Format AI Response`
4. Code:

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

5. Click **Save**

6. Click **+** after Format AI Response → Search `Evolution API`
7. Add **Evolution API** node
8. Configure:
   - Instance Name: `localplug-main`
   - Phone Number: `{{ $json.phone }}`
   - Text: `{{ $json.message }}`
9. Click **Save**

#### Step 9: Add Webhook Callback (for both paths)

For each Evolution API node (escalation and normal response), add:

1. Click **+** → Search `HTTP Request`
2. Add **HTTP Request** node
3. Name: `Save to App DB`
4. Configure:
   - Method: `POST`
   - URL: `https://localplug.vercel.app/api/webhooks/n8n`
   - Body:
     ```json
     {
       "event": "whatsapp-ai-response",
       "data": {
         "conversationId": 0,
         "message": "{{ $json.message }}",
         "confidence": 0.95
       },
       "timestamp": "{{ $now.toISO() }}"
     }
     ```
5. Click **Save**

#### Step 10: Connect All Nodes

Connect the nodes in this order:

```
Webhook → Is Incoming Message? → Not From Me? → Extract Message Data → OpenAI → Needs Escalation?
                                                                                      │
                                                                         ┌──────────────┴──────────────┐
                                                                         ▼                              ▼
                                                              Notify App - Escalation          Format AI Response
                                                                         │                              │
                                                                         ▼                              ▼
                                                              Evolution API (escalation)    Evolution API (response)
                                                                         │                              │
                                                                         ▼                              ▼
                                                              Save to App DB (esc)          Save to App DB (resp)
```

#### Step 11: Test Workflow

1. Click **Test workflow**
2. Send test WhatsApp message from your phone
3. Verify: AI responds automatically
4. Test escalation: Send "hablar con alguien"
5. Verify: Escalation message received

#### Step 12: Activate Workflow

1. Click **Active** toggle
2. Workflow is now live

---

### Workflow 3: Status Tracking

**Purpose**: Track WhatsApp message delivery status and instance health.

#### Step 1: Create New Workflow

1. Click **New Workflow**
2. Name: `WhatsApp Status Tracking`
3. Click **Save**

#### Step 2: Add Webhook Trigger

1. Click **+** → Search `Webhook`
2. Add **Webhook** node
3. Configure:
   - HTTP Method: `POST`
   - Path: `evolution-events`
   - (Same as Workflow 2 - n8n can handle multiple workflows on same webhook)
4. Click **Listen for test event**

#### Step 3: Add Switch Node (Route by Event)

1. Click **+** after Webhook → Search `Switch`
2. Add **Switch** node
3. Name: `Route by Event Type`
4. Rules:
   - `message-receipt.update` → Output 1
   - `instance.status` → Output 2
   - `connection.update` → Output 3
   - Default → Output 4
5. Click **Save**

#### Step 4: Add Log Nodes

For each output, add a **Code** node to log:

**Output 1 (message-receipt.update)**:
```javascript
const data = $input.first().json.data;
console.log(`[WhatsApp Status] Message ${data.key?.id}: ${data.status}`);
return [{ json: { logged: true, event: 'receipt', status: data.status } }];
```

**Output 2 (instance.status)**:
```javascript
const data = $input.first().json.data;
console.log(`[WhatsApp Status] Instance: ${data.status}`);
return [{ json: { logged: true, event: 'instance', status: data.status } }];
```

**Output 3 (connection.update)**:
```javascript
const data = $input.first().json.data;
console.log(`[WhatsApp Status] Connection: ${data.state}`);
if (data.state === 'close') {
  // Alert: Instance disconnected
  console.error('[WhatsApp ALERT] Instance disconnected!');
}
return [{ json: { logged: true, event: 'connection', state: data.state } }];
```

#### Step 5: Activate Workflow

1. Click **Active** toggle
2. Workflow is now live

---

## Part 4: Environment Variables

Add these to your `.env.local` (or Vercel environment variables):

```env
# Evolution API
EVOLUTION_API_URL=https://api-message.innotechlabssas.lat
EVOLUTION_API_KEY=evo_k1_localplug_2026_secure_key_here
EVOLUTION_INSTANCE_NAME=localplug-main

# n8n
N8N_BASE_URL=https://agent-ia.innotechlabssas.lat
N8N_API_KEY=your-n8n-api-key

# OpenAI (for n8n AI Agent)
OPENAI_API_KEY=sk-your-openai-api-key
```

---

## Part 5: Testing Checklist

### Test 1: Payment → WhatsApp
- [ ] Complete a test booking on the website
- [ ] Complete Stripe payment
- [ ] WhatsApp welcome message received
- [ ] Message contains correct booking details
- [ ] Message is in correct language

### Test 2: User Message → AI Response
- [ ] Send "hola" → AI responds in Spanish
- [ ] Send "hello" → AI responds in English
- [ ] Send "¿qué paquetes tienen?" → AI lists packages
- [ ] Send "quiero reservar" → AI guides booking
- [ ] Response time < 5 seconds

### Test 3: Escalation
- [ ] Send "hablar con alguien" → Escalation triggered
- [ ] Send "tengo una queja" → Escalation triggered
- [ ] Send "refund" → Escalation triggered
- [ ] Admin sees escalation in /admin/ia-chat
- [ ] Escalation badge shows correctly

### Test 4: Admin Takeover
- [ ] Admin clicks "Take Over" on WhatsApp conversation
- [ ] AI stops responding
- [ ] Admin can type and send messages
- [ ] Messages appear on user's WhatsApp
- [ ] Admin clicks "AI Mode" → AI resumes

### Test 5: Status Tracking
- [ ] WhatsApp delivery status logged in DB
- [ ] Instance disconnect alerts appear
- [ ] Message read receipts tracked

---

## Troubleshooting

### WhatsApp not connecting
- Check Evolution API logs in EasyPanel
- Verify QR code was scanned correctly
- Check phone has internet connection
- Restart Evolution API service

### Messages not sending
- Verify Evolution API credentials in n8n
- Check phone number format (country code + number, no spaces)
- Check Evolution API instance status is "open"
- Check n8n execution logs for errors

### AI not responding
- Verify OpenAI API key in n8n
- Check n8n execution logs
- Verify webhook is receiving events
- Check conversation status in DB (must be "ai_active")

### Webhook not receiving events
- Verify Evolution API webhook URL is correct
- Check Cloudflare proxy is enabled
- Verify n8n API key matches in both Evolution API and n8n
- Check n8n is accessible: `curl https://agent-ia.innotechlabssas.lat/healthz`
