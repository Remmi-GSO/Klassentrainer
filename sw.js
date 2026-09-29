const CACHE_NAME = 'klassen-trainer-v11.5.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './libs/jszip.min.js',
  './libs/xlsx.full.min.js',
  './libs/pdf.min.js',
  './libs/pdf.worker.min.js',
  './css/variables.css?v=11.5',
  './css/base.css?v=11.5',
  './css/components.css?v=11.5',
  './css/modes.css?v=11.5',
  './js/app.js?v=11.5',
  './js/app.js',
  './js/db.js',
  './js/store.js',
  './js/parser.js',
  './js/phonetics.js',
  './js/image-processor.js',
  './js/audio.js',
  './js/gestures.js',
  './js/zip-manager.js',
  './js/excel-importer.js',
  './js/pdf-importer.js',
  './js/modes/alpha-mode.js',
  './js/modes/random-mode.js',
  './js/modes/leitner-mode.js'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Mit cache: 'reload' laden, damit nicht versehentlich alte Dateien aus dem Browser-HTTP-Cache übernommen werden
      await Promise.all(
        ASSETS_TO_CACHE.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { cache: 'reload' }));
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            // Fallback auf Standard-Cache-Add falls offline
            try { await cache.add(url); } catch (_) {}
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Nur GET Anfragen bearbeiten
  if (event.request.method !== 'GET') return;

  const reqUrl = new URL(event.request.url);
  // Explizite Update-Prüfungen (?t=... oder ?r=...) immer direkt vom Server holen
  if (reqUrl.searchParams.has('t') || reqUrl.searchParams.has('r')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-While-Revalidate: Gecachter Content sofort, Update im Hintergrund (mit cache: 'no-cache')
        fetch(event.request, { cache: 'no-cache' }).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline */});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(async (err) => {
        // Offline Fallback ohne Query-Parameter
        const fallbackMatch = await caches.match(event.request, { ignoreSearch: true });
        if (fallbackMatch) return fallbackMatch;
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw err;
      });
    })
  );
});
