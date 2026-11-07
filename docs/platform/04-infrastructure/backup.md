# Operations — Backup

## Database (Turso / libSQL)
- Scheduled automated backups (point-in-time where supported).
- Off-site copy of backup artifacts.
- Tested restore procedure (quarterly).

## Files & media
- Backups of uploaded assets (if stored on disk, not object storage).

## Principles
- Soft deletes preserve audit history — backups complement, not replace, this.
- Backup + restore drills are part of the quarterly ops checklist.
- Never delete backups to "clean up"; retain per retention policy.
