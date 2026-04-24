// ═══════════════════════════════════════════════════════════════
// PODBARA SERVICE WORKER — offline support
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'podbara-v1'

// Resources to cache on install
const PRECACHE_URLS = [
  './',
  './od-vrata-do-vrata.html',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap',
]

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache what we can, ignore failures for CDN resources
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(() => console.warn('[SW] Failed to cache:', url))
        )
      )
    }).then(() => self.skipWaiting())
  )
})

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Never intercept Supabase API calls — let them fail naturally offline
  // The app JS handles queuing when offline
  if (url.hostname.includes('supabase.co')) {
    return
  }

  // For Supabase JS SDK from CDN — network first, cache fallback
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // For the app HTML — network first, cache fallback
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./od-vrata-do-vrata.html')))
    )
    return
  }

  // Default: network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'podbara-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_REQUESTED' })
        })
      })
    )
  }
})

// ── Push message from app ─────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
