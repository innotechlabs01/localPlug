# Diagnostic Checklist: QR Evolution Manager Fix

## Root Cause Identified ✅

**Variable de entorno faltante**: `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510`

**Fuente**: Video "Evolution API no genera QR - Noviembre 2025" de Pildoras de Programación.

**Evidencia**: Restart endpoint returns `[object Object]` error → confirma que la variable no está configurada.

## Fix Checklist

### EasyPanel Configuration
- [ ] Agregar `CONFIG_SESSION_PHONE_VERSION=2.3000.1028355510` en EasyPanel
- [ ] Reiniciar contenedor evolution-api
- [ ] Verificar: `curl https://api-message.innotechlabssas.lat/` retorna version info

### Instance Connection
- [ ] Reiniciar instancia via API: `POST /instance/restart/localplug-main`
- [ ] QR code generado exitosamente (base64 PNG)
- [ ] Escanear QR con WhatsApp (Linked Devices → Link a Device)
- [ ] Instance status cambia a "open" (connected)

### Anti-Baneo Settings
- [ ] `rejectCall: true`
- [ ] `alwaysOnline: true`
- [ ] `readMessages: true`
- [ ] `readStatus: true`
- [ ] `groupsIgnore: true`
- [ ] `syncFullHistory: false`

### Webhook Verification
- [ ] n8n workflow "Evolution Events - AI Agent" is ACTIVE
- [ ] Webhook URL: `https://agent-ia.innotechlabssas.lat/webhook/evolution-events`
- [ ] Test incoming WhatsApp message → appears in n8n
- [ ] Test outgoing WhatsApp message → delivered via Evolution API

### End-to-End Verification
- [ ] Test booking → WhatsApp welcome message received
- [ ] Reply to welcome → message appears in Admin IA Chat
- [ ] Admin replies in IA Chat → WhatsApp receives reply
- [ ] Instance remains connected for 24 hours

## Diagnostic Commands

```bash
# Check Evolution API status
curl https://api-message.innotechlabssas.lat/

# Check instance status
curl "https://api-message.innotechlabssas.lat/instance/fetchInstances" \
  -H "apiKey: evo_k1_localplug_2026_secure_key_here"

# Restart instance (will fail until variable is set)
curl -X POST "https://api-message.innotechlabssas.lat/instance/restart/localplug-main" \
  -H "apiKey: evo_k1_localplug_2026_secure_key_here"

# Check n8n workflows
curl "https://agent-ia.innotechlabssas.lat/api/v1/workflows" \
  -H "X-N8N-API-KEY: <your-n8n-api-key>"
```

## Expected Results After Fix

| Check | Before Fix | After Fix |
|-------|-----------|-----------|
| Restart endpoint | `[object Object]` error | QR code generated |
| Instance status | "connecting" | "open" |
| Phone number | null | +57XXXXXXXXXX |
| Owner JID | null | valid JID |
| Anti-baneo | Not configured | All settings applied |
| WhatsApp messages | Not working | Working end-to-end |
