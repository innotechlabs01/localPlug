# Quickstart: Fix QR Evolution Manager Connection

**Problem**: Evolution API no genera QR en contenedores Docker porque falta la variable de entorno `CONFIG_SESSION_PHONE_VERSION`.

**Root Cause**: Variable `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510` no configurada en el contenedor Docker de Evolution API en EasyPanel.

**Fuente**: Video "Evolution API no genera QR - Noviembre 2025" de Pildoras de Programación.

## Step 1: Add Environment Variable in EasyPanel

1. Go to **EasyPanel** → `evolution-api` container
2. Go to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `CONFIG_SESSION_PHONE_VERSION`
   - **Value**: `2.3000.1028355510`
4. Click **Save**

## Step 2: Restart Evolution API Container

1. In EasyPanel, go to `evolution-api` container
2. Click **Restart** (or Stop → Start)
3. Wait 30 seconds for the container to fully start
4. Verify: `curl https://api-message.innotechlabssas.lat/` should return version info

## Step 3: Restart Instance via API

```bash
curl -X POST "https://api-message.innotechlabssas.lat/instance/restart/localplug-main" \
  -H "apiKey: evo_k1_localplug_2026_secure_key_here"
```

Expected response: QR code as base64 PNG image.

## Step 4: Scan QR with WhatsApp

1. Open Evolution Manager: `https://api-message.innotechlabssas.lat/manager/`
2. Find instance `localplug-main`
3. Click **Connect** (or use the QR from Step 3)
4. Open WhatsApp on phone → **Linked Devices** → **Link a Device**
5. Scan the QR code
6. Wait for status to change to "open"

## Step 5: Configure Anti-Baneo Settings

After connection, edit instance settings in Manager:

```json
{
  "rejectCall": true,
  "groupsIgnore": true,
  "alwaysOnline": true,
  "readMessages": true,
  "readStatus": true,
  "syncFullHistory": false,
  "retries": 3
}
```

## Step 6: Verify End-to-End Flow

1. Trigger a test payment (or use existing API)
2. Check that WhatsApp welcome message is received
3. Reply to the message and confirm it appears in Admin IA Chat
4. Send a reply from Admin IA Chat and confirm delivery on WhatsApp

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Restart returns `[object Object]` error | Variable `CONFIG_SESSION_PHONE_VERSION` not set — go back to Step 1 |
| QR not appearing in Manager | Restart the instance again after setting the variable |
| Instance stuck in "connecting" | Restart and scan fresh QR |
| Anti-baneo fails | Apply settings via Manager UI after connection |
| Webhooks not firing | Check n8n workflow "Evolution Events - AI Agent" is active |

## Verification Commands

```bash
# Check Evolution API is running
curl https://api-message.innotechlabssas.lat/

# Check instance status
curl "https://api-message.innotechlabssas.lat/instance/fetchInstances" \
  -H "apiKey: evo_k1_localplug_2026_secure_key_here"

# Restart instance
curl -X POST "https://api-message.innotechlabssas.lat/instance/restart/localplug-main" \
  -H "apiKey: evo_k1_localplug_2026_secure_key_here"

# Check n8n workflow status
curl "https://agent-ia.innotechlabssas.lat/api/v1/workflows" \
  -H "X-N8N-API-KEY: <your-n8n-api-key>"
```
