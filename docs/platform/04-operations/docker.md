# Operations — Docker

## Services
```yaml
services:
  admin-portal:    # Next.js admin dashboard
  driver-portal:   # Next.js driver PWA
  ws-server:       # Socket.IO real-time service
  n8n:             # workflow automation
  evolution-api:   # WhatsApp integration
  ollama:          # local AI (optional)
```

## Layout
- `infrastructure/docker/` — per-service Dockerfiles
- `infrastructure/docker-compose.yml` — local dev stack
- `infrastructure/terraform/` — IaC (future)

## Rules
- Multi-stage builds; minimal production images.
- Non-root users in containers.
- Healthcheck endpoints on every service.
- WebSocket service must be a long-running container, not a serverless function.
