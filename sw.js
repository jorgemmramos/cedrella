const CACHE_NAME = 'cedrella-v1.0';

// All app-shell files, relative to the SW scope
const SHELL_FILES = [
  './',
  './src/theme/CedrellaTheme.css',
  './manifest.json',
  './icons/icon.svg',
  './src/components/Dashboard.js',
  './src/components/MetricCard.js',
  './src/components/AlertBanner.js',
  './src/services/BleService.js',
  './src/services/StorageService.js',
  './src/i18n/pt.js',
];

// ── Install ─────────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Cache all local shell files (must succeed)
      await cache.addAll(SHELL_FILES);

      // Cache external Dexie CDN — optional, failure is non-fatal
      try {
        await cache.add('https://unpkg.com/dexie@3/dist/dexie.min.js');
      } catch {
        console.warn('[SW] Could not cache Dexie from CDN — offline DB unavailable on first load');
      }

      return self.skipWaiting();
    })
  );
});

// ── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch (cache-first for GET) ──────────────────────────────────────────────

self.addEventListener('fetch', event => {
  // Only intercept GET requests — let POST/others through unmodified
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful same-origin and CDN responses for future offline use
        if (response.ok && (
          event.request.url.startsWith(self.location.origin) ||
          event.request.url.includes('unpkg.com')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback: return cached shell root
      return caches.match('./') ?? new Response('Offline', { status: 503 });
    })
  );
});

// ── Background sync (active when migrating StorageService to cloud) ─────────
// When StorageService writes to a remote API and the request fails,
// Dashboard calls: navigator.serviceWorker.ready.then(r => r.sync.register('cedrella-sync'))
// The SW then notifies all clients to retry pending writes stored in IndexedDB.

self.addEventListener('sync', event => {
  if (event.tag !== 'cedrella-sync') return;

  event.waitUntil(
    self.clients.matchAll().then(clients =>
      clients.forEach(c => c.postMessage({ type: 'RETRY_WRITES' }))
    )
  );
});
