/* LocalPlug Driver — Service Worker v2
 * - /api/* and cross-origin requests: NetworkOnly (never cache authenticated/private API data)
 * - Navigations: NetworkFirst with 3.5s timeout, falling back to /driver/offline
 * - Same-origin immutable static assets (/_next/static/*, /images/*): CacheFirst (only resp.ok)
 */
const CACHE = 'localplug-driver-v2'
const PRECACHE = ['/driver/offline', '/manifest.webmanifest', '/images/icon/icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {})
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never intercept cross-origin requests (Clerk, analytics, etc.) or API routes
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return
  }

  // Page navigations: NetworkFirst with timeout -> offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 3500)
        try {
          const resp = await fetch(request, { signal: controller.signal })
          clearTimeout(timer)
          return resp
        } catch {
          clearTimeout(timer)
          const offline = await caches.match('/driver/offline')
          return offline || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }
      })(),
    )
    return
  }

  // Only cache same-origin static assets (immutable Next chunks, images, fonts)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/manifest.webmanifest'

  if (!isStaticAsset) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((resp) => {
        if (resp && resp.ok && resp.type === 'basic') {
          const copy = resp.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
        }
        return resp
      })
    }),
  )
})
