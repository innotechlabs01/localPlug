# Engineering — Security

## Authentication
- JWT short expiry (15 min); refresh managed by Clerk.
- OTP expires after 5 minutes; max 3 attempts before lockout.
- Device fingerprinting for session management.

## API
- All endpoints require authentication (Clerk JWT).
- Rate limiting on public endpoints.
- Input validation on all requests (Zod).
- CORS configured per application.
- No sensitive data in URLs or logs.

## Data
- Passwords never stored (Clerk handles).
- Phone numbers masked in logs.
- API keys in env vars, never in code.
- DB connections use TLS.
- Soft deletes preserve data for audit.

## WebSocket
- Clerk JWT required to connect.
- Room access verified on join.
- No sensitive data in event payloads.
- Connection timeout after 30 min inactivity.

See `../02-architecture/realtime.md` and `../02-architecture/packages.md` (auth).
