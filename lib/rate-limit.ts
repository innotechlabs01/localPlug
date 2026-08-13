import { getRateLimitConfig } from '@/lib/config'
import { getDb } from '@/lib/db'
import { logger } from '@/lib/logger'

let _maxRequests = 20
let _windowMs = 60_000
let _rateConfigLoaded = false

let _redisClient: ReturnType<typeof createRedisClient> | null = null
let _redisFailed = false

function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

let _healthCheckTimer: ReturnType<typeof setInterval> | null = null

function startRedisHealthCheck() {
  if (_healthCheckTimer || !_redisClient) return
  _healthCheckTimer = setInterval(async () => {
    try {
      const response = await fetch(`${_redisClient!.url}/ping`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${_redisClient!.token}` },
      })
      if (response.ok) {
        if (_redisFailed) {
          console.log('[RateLimit] Redis recovered, resetting fallback')
          _redisFailed = false
        }
      } else if (!_redisFailed) {
        _redisFailed = true
      }
    } catch {
      if (!_redisFailed) {
        console.error('[RateLimit] Redis health check failed, falling back to in-memory')
        _redisFailed = true
      }
    }
  }, 30_000)
}

async function redisIncr(key: string, ttlMs: number): Promise<number> {
  if (_redisFailed || !_redisClient) return -1
  try {
    const ttl = Math.ceil(ttlMs / 1000)
    const response = await fetch(
      `${_redisClient.url}/incr/${encodeURIComponent(key)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${_redisClient.token}` },
      },
    )
    if (!response.ok) throw new Error(`Upstash HTTP ${response.status}`)
    const data = await response.json() as { result: number }
    if (data.result === 1) {
      await fetch(
        `${_redisClient.url}/expire/${encodeURIComponent(key)}/${ttl}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${_redisClient.token}` },
        },
      )
    }
    return data.result
  } catch (err) {
    console.error('[RateLimit] Redis error, falling back to in-memory:', err)
    _redisFailed = true
    return -1
  }
}

async function initRateConfig() {
  if (_rateConfigLoaded) return
  try {
    const cfg = await getRateLimitConfig()
    _maxRequests = cfg.maxRequests
    _windowMs = cfg.windowMs
    _rateConfigLoaded = true
  } catch {
    _rateConfigLoaded = true
  }
}

_redisClient = createRedisClient()
if (typeof setInterval !== 'undefined') {
  startRedisHealthCheck()
}

const requestCounts = new Map<string, { count: number; resetAt: number }>()

const CLEANUP_INTERVAL = 60_000

function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) {
      requestCounts.delete(key)
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, CLEANUP_INTERVAL)
}

export function extractIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1'
}

function extractUserId(req: Request): string | null {
  return req.headers.get('x-clerk-user-id') || null
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// ─── IP Ban Escalation ──────────────────────────────────────────────

interface BanEscalation {
  violations: number
  banMinutes: number
}

const BAN_ESCALATION: BanEscalation[] = [
  { violations: 10, banMinutes: 120 },  // 10+ violations → 2 hour ban
  { violations: 5, banMinutes: 30 },    // 5+ violations → 30 min ban
  { violations: 3, banMinutes: 5 },     // 3+ violations → 5 min ban
]

/**
 * Check if an IP is currently banned in the database.
 * Returns null if allowed, or a Response (403) if banned.
 */
export async function checkIpBanned(ip: string): Promise<Response | null> {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: `SELECT id, expires_at, violation_count FROM ip_bans
            WHERE ip = ? AND unbanned = 0 AND expires_at > datetime('now')
            ORDER BY expires_at DESC LIMIT 1`,
      args: [ip],
    })

    if (result.rows.length > 0) {
      const row = result.rows[0] as unknown as { expires_at: string; violation_count: number }
      const expiresAt = new Date(row.expires_at + 'Z')
      const retryAfter = Math.ceil((expiresAt.getTime() - Date.now()) / 1000)

      logger.warn('[RateLimit] IP banned', {
        ip,
        violations: row.violation_count,
        expiresAt: row.expires_at,
        retryAfter,
      })

      return new Response(
        JSON.stringify({
          error: 'ip_banned',
          message: 'Your IP has been temporarily banned due to repeated violations.',
          retryAfter,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.max(1, retryAfter)),
          },
        },
      )
    }
  } catch (err) {
    // DB unavailable — fail open (allow request)
    logger.error('[RateLimit] Failed to check IP ban', err instanceof Error ? err : undefined)
  }
  return null
}

/**
 * Record a rate limit violation for an IP.
 * Escalates ban duration based on violation count.
 */
export async function recordViolation(ip: string, path: string): Promise<void> {
  try {
    const db = getDb()

    // Count violations in the last hour
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM ip_bans
            WHERE ip = ? AND banned_at > datetime('now', '-1 hour')`,
      args: [ip],
    })
    const recentViolations = (countResult.rows[0] as unknown as { cnt: number }).cnt + 1

    // Determine ban duration based on escalation tiers
    let banMinutes = 5 // default
    for (const tier of BAN_ESCALATION) {
      if (recentViolations >= tier.violations) {
        banMinutes = tier.banMinutes
        break
      }
    }

    // Upsert: if IP already has an active unexpired ban, increment count and extend
    const existing = await db.execute({
      sql: `SELECT id FROM ip_bans
            WHERE ip = ? AND unbanned = 0 AND expires_at > datetime('now')
            ORDER BY expires_at DESC LIMIT 1`,
      args: [ip],
    })

    if (existing.rows.length > 0) {
      const banId = (existing.rows[0] as unknown as { id: number }).id
      await db.execute({
        sql: `UPDATE ip_bans
              SET violation_count = violation_count + 1,
                  expires_at = datetime('now', '+${banMinutes} minutes')
              WHERE id = ?`,
        args: [banId],
      })
    } else {
      await db.execute({
        sql: `INSERT INTO ip_bans (ip, reason, violation_count, expires_at)
              VALUES (?, 'rate_limit_violations', 1, datetime('now', '+${banMinutes} minutes'))`,
        args: [ip],
      })
    }

    logger.warn('[RateLimit] Violation recorded', {
      ip,
      path,
      recentViolations,
      banMinutes,
    })
  } catch (err) {
    logger.error('[RateLimit] Failed to record violation', err instanceof Error ? err : undefined)
  }
}

// ─── Rate Limit Check ───────────────────────────────────────────────

export async function checkRateLimit(
  reqOrIp: Request | string,
  opts?: { userId?: string; maxRequests?: number },
): Promise<RateLimitResult> {
  await initRateConfig()
  const maxReqs = opts?.maxRequests ?? _maxRequests
  const now = Date.now()

  const ip = typeof reqOrIp === 'string' ? reqOrIp : extractIp(reqOrIp)
  const userId = typeof reqOrIp === 'string' ? opts?.userId : (opts?.userId || extractUserId(reqOrIp))

  const key = userId ? `rate:user:${userId}` : `rate:ip:${ip}`

  if (_redisClient && !_redisFailed) {
    const count = await redisIncr(key, _windowMs)
    if (count >= 0) {
      const remaining = maxReqs - count
      return {
        allowed: count <= maxReqs,
        remaining: Math.max(0, remaining),
        resetAt: now + _windowMs,
      }
    }
  }

  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + _windowMs })
    return { allowed: true, remaining: maxReqs - 1, resetAt: now + _windowMs }
  }

  if (entry.count >= maxReqs) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxReqs - entry.count, resetAt: entry.resetAt }
}

export async function rateLimitMiddleware(
  req: Request,
  opts?: { maxRequests?: number; requireUser?: boolean },
): Promise<Response | null> {
  const userId = extractUserId(req)
  const ip = extractIp(req)

  if (opts?.requireUser && !userId) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const result = userId
    ? await checkRateLimit(req, { userId, maxRequests: opts?.maxRequests })
    : await checkRateLimit(req, { maxRequests: opts?.maxRequests })

  if (!result.allowed) {
    const path = new URL(req.url).pathname
    // Record violation for IP-based rate limiting (escalating bans)
    if (!userId) {
      recordViolation(ip, path).catch(() => {})
    }

    logger.warn('[RateLimit] Blocked', {
      ip,
      userId,
      path,
      remaining: result.remaining,
    })

    return new Response(
      JSON.stringify({ error: 'too_many_requests', message: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  const response = new Response(null, { status: 204 })
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  return null
}

const BURST_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  api:     { maxRequests: 20, windowMs: 60_000 },
  admin:   { maxRequests: 60, windowMs: 60_000 },
  webhook: { maxRequests: 30, windowMs: 60_000 },
}

export async function applyRateLimit(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url)

  if (pathname.startsWith('/api/admin/')) {
    return rateLimitMiddleware(req, { maxRequests: BURST_LIMITS.admin.maxRequests })
  }
  if (pathname.startsWith('/api/webhooks/')) {
    return rateLimitMiddleware(req, { maxRequests: BURST_LIMITS.webhook.maxRequests })
  }
  if (pathname.startsWith('/api/')) {
    return rateLimitMiddleware(req, { maxRequests: BURST_LIMITS.api.maxRequests })
  }

  return null
}
