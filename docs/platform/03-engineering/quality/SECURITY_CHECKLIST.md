# Security Checklist

Apply to every feature touching auth, data, or networking. Derived from
`../03-engineering/security.md` and `../00-CONSTITUTION.md` §10.

## Authentication
- [ ] JWT short expiry (15 min); refresh via Clerk
- [ ] OTP expires in 5 min; max 3 attempts then lockout
- [ ] Device fingerprinting for sessions

## API
- [ ] All endpoints require authentication
- [ ] Rate limiting on public endpoints
- [ ] Input validation on all requests (Zod)
- [ ] CORS per application
- [ ] No sensitive data in URLs or logs

## Data
- [ ] Passwords never stored (Clerk)
- [ ] Phone numbers masked in logs
- [ ] API keys in env vars, never in code
- [ ] DB connections use TLS
- [ ] Soft deletes preserve audit history

## WebSocket
- [ ] Clerk JWT required to connect
- [ ] Room access verified on join
- [ ] No sensitive data in event payloads
- [ ] Connection timeout after inactivity

## Secrets
- [ ] No secrets committed; managed in Coolify
- [ ] `.env*` git-ignored
