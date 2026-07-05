import { getRateLimitConfig } from '@/lib/config'

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

function extractIp(req: Request): string {
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
