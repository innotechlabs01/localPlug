/* LocalPlug Driver — service worker (network-first for API, cache-first for static) */
const CACHE = 'localplug-driver-v1'
const PRECACHE = ['/driver', '/driver/assignments', '/driver/earnings', '/manifest.webmanifest']

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

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // API calls: network-first so the driver always gets fresh data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
          return resp
        })
        .catch(() => caches.match(request)),
    )
    return
  }

  // Static / page navigations: stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
          return resp
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/driver'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((resp) => {
        const copy = resp.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
        return resp
      })
    }),
  )
})