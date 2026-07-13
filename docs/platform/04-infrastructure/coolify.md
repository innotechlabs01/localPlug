# Operations — Coolify

Coolify manages deployment of the Docker services on Hetzner.

## Responsibilities
- Pull images / build from git.
- Inject environment variables per environment.
- Zero-downtime deploys (blue/green per service).
- TLS termination and reverse proxy.
- Health-check gating before routing traffic.

## Rules
- No direct production deploys; all via CI/CD → Coolify.
- DB migrations run before app deploy (Coolify lifecycle hook or CI step).
- Rollback to previous image is one click; required capability.
- Secrets managed in Coolify, mirrored from env files — never committed.

See `../02-architecture/deployment.md` for the pipeline.
