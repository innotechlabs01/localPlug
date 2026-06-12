const requestCounts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

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

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt }
}

export function rateLimitMiddleware(req: Request): Response | null {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1'
  const result = checkRateLimit(ip)

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
