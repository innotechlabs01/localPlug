# Sentinel Security Journal

## 2026-11-07 - Webhook Bearer Token Authentication Gap
**Vulnerability:** External webhook receivers (`/api/webhooks/evolution` and `/api/webhooks/n8n`) handled unauthenticated HTTP POST requests, enabling arbitrary external callers to forge WhatsApp messages, spoof payment confirmations, trigger fake agent escalations, and manipulate conversations/messages in the database.
**Learning:** While third-party payment webhooks (Stripe) used cryptographic HMAC signature verification, custom inter-service integration webhooks (Evolution API and n8n) omitted authentication checks despite having pre-configured API keys in `.env` and specification requirements.
**Prevention:** Enforce Bearer token authorization with constant-time comparison (`crypto.timingSafeEqual`) on all incoming webhook routes whenever API key secrets are provisioned.
