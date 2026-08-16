# WhatsApp Quick Configuration Guide

## Overview

This guide covers the minimal steps to enable WhatsApp chat integration with the App Direct architecture.

## Architecture

```
WhatsApp User → Evolution API → App Webhook → AI Response → Evolution API → WhatsApp User
```

## Step 1: Configure Evolution API Webhook in EasyPanel

1. Go to EasyPanel → `evolution-api` → **Settings** → **Environment**
2. Update or add these variables:

```env
# Webhook URL - Points to the App (NOT n8n)
WEBHOOK_GLOBAL_URL=https://localplug.vercel.app/api/webhooks/evolution

# Webhook Auth - Must match EVOLUTION_WEBHOOK_SECRET in Vercel
WEBHOOK_GLOBAL_HEADERS={"x-evolution-signature":"YOUR_SECRET_HERE"}
```

3. Click **Save** and **Restart** the Evolution API service

## Step 2: Configure Vercel Environment Variables

Go to Vercel → Project → **Settings** → **Environment Variables**

Add or verify these variables:

```env
# Evolution API Connection
EVOLUTION_API_URL=https://api-message.innotechlabssas.lat
EVOLUTION_API_KEY=your_evolution_api_key_here
EVOLUTION_INSTANCE_NAME=localplug-main

# Webhook Secret (must match EasyPanel configuration)
EVOLUTION_WEBHOOK_SECRET=your_secret_here

# WhatsApp Business Number (for wa.me link in chat widget)
NEXT_PUBLIC_WHATSAPP_NUMBER=573001234567
```

## Step 3: Generate a Secure Secret

Run this command to generate a secure secret:

```bash
openssl rand -hex 32
```

Use the same secret in both:
- EasyPanel: `WEBHOOK_GLOBAL_HEADERS={"x-evolution-signature":"THE_SECRET"}`
- Vercel: `EVOLUTION_WEBHOOK_SECRET=THE_SECRET`

## Step 4: Test the Configuration

### Test 1: Verify Webhook URL

```bash
curl -X POST https://localplug.vercel.app/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -H "x-evolution-signature: YOUR_SECRET" \
  -d '{"event":"test","instance":"localplug-main","data":{}}'
```

Expected response: `{"success":true,"processed":"test"}`

### Test 2: Send WhatsApp Message

1. Open WhatsApp on your phone
2. Send a message to your Business number
3. Check Vercel logs for: `[Evolution Webhook] Received: messages.upsert`
4. You should receive an AI response within 5 seconds

## Step 5: Verify in Admin Dashboard

1. Go to `https://localplug.vercel.app/admin/ia-chat`
2. Filter by channel: **WhatsApp**
3. You should see conversations from WhatsApp users
4. Test takeover: Click **Take Over** on a conversation
5. Send a message - it should reach the user on WhatsApp

## Troubleshooting

### Webhook not receiving events

1. Check Evolution API logs in EasyPanel
2. Verify `WEBHOOK_GLOBAL_URL` is correct
3. Check Cloudflare DNS is working: `curl https://api-message.innotechlabssas.lat/manager`

### AI not responding

1. Check Vercel logs for errors
2. Verify `OPENAI_API_KEY` (NVIDIA NIM key) and `OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1` are set correctly
3. If NVIDIA rate-limited (429), the app falls back to `OLLAMA_BASE_URL` automatically
4. Check conversation status in database (must be `ai_active`)

### Admin messages not reaching WhatsApp

1. Verify `EVOLUTION_API_KEY` is correct
2. Check Evolution API instance status is `open`
3. Look for errors in Vercel logs: `[Chat Send] Failed to send WhatsApp message`

### Signature validation failing

1. Ensure same secret in EasyPanel and Vercel
2. Check header format: `{"x-evolution-signature":"YOUR_SECRET"}`
3. Verify no extra spaces or characters in the secret

## Environment Variables Summary

| Variable | Location | Description |
|----------|----------|-------------|
| `EVOLUTION_API_URL` | Vercel | Evolution API endpoint |
| `EVOLUTION_API_KEY` | Vercel | Evolution API authentication |
| `EVOLUTION_INSTANCE_NAME` | Vercel | WhatsApp instance name |
| `EVOLUTION_WEBHOOK_SECRET` | Vercel | Webhook signature secret |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Vercel | Business number for wa.me link |
| `OPENAI_API_KEY` | Vercel | NVIDIA NIM API key (primary AI provider) |
| `OPENAI_BASE_URL` | Vercel | `https://integrate.api.nvidia.com/v1` |
| `OPENAI_MODEL` | Vercel | NVIDIA free model (e.g. `meta/llama-3.1-8b-instruct`) |
| `OLLAMA_BASE_URL` | Vercel | Local Ollama fallback (e.g. `http://<server-ip>:11434`) |
| `OLLAMA_MODEL` | Vercel | Ollama fallback model (e.g. `llama3.1:8b`) |
| `WEBHOOK_GLOBAL_URL` | EasyPanel | Webhook destination URL |
| `WEBHOOK_GLOBAL_HEADERS` | EasyPanel | Webhook authentication headers |
