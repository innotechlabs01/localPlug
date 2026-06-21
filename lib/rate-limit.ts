import { getRateLimitConfig } from '@/lib/config'

let _maxRequests = 20
let _windowMs = 60_000
let _rateConfigLoaded = false

async function initRateConfig() {
  if (_rateConfigLoaded) return
  try {
    const cfg = await getRateLimitConfig()
    _maxRequests = cfg.maxRequests
    _windowMs = cfg.windowMs
    _rateConfigLoaded = true
  } catch {
    // Keep defaults if config fails to load
  }
}

const requestCounts = new Map<string, { count: number; resetAt: number }>()

// Periodically purge expired entries to prevent unbounded Map growth.
// This is a single-instance limiter — in multi-instance deployments (Vercel),
// each instance has its own independent Map, making the rate limit
// per-instance rather than global. For production multi-instance,
// replace with an external store (Upstash/Redis).
const CLEANUP_INTERVAL = 60_000

function cleanupExpired(): void {
  const now = Date.now()
  for (const [ip, entry] of requestCounts) {
    if (now > entry.resetAt) {
      requestCounts.delete(ip)
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, CLEANUP_INTERVAL)
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  await initRateConfig()
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + _windowMs })
    return { allowed: true, remaining: _maxRequests - 1, resetAt: now + _windowMs }
  }

  if (entry.count >= _maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: _maxRequests - entry.count, resetAt: entry.resetAt }
}

export async function rateLimitMiddleware(req: Request): Promise<Response | null> {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1'
  const result = await checkRateLimit(ip)

  if (!result.allowed) {
    return new Response(JSON.stringify({ error: 'too_many_requests', message: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  return null
}
