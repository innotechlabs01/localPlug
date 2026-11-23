-- 037: IP bans table for rate limit escalation
-- Tracks IPs that repeatedly violate rate limits with escalating ban durations.

CREATE TABLE IF NOT EXISTS ip_bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'rate_limit_violations',
  violation_count INTEGER NOT NULL DEFAULT 1,
  banned_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  unbanned INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ip_bans_ip ON ip_bans(ip);
CREATE INDEX IF NOT EXISTS idx_ip_bans_expires ON ip_bans(expires_at);
CREATE INDEX IF NOT EXISTS idx_ip_bans_active ON ip_bans(ip, unbanned, expires_at);
