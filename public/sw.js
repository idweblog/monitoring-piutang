const CACHE_NAME = 'monitor-piutang-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-growth.svg',
  '/logo-vault.svg',
  '/logo-minimalist.svg'
];

// Install Event - caching initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell and core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache store:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - network-first fallback to cache strategy to guarantee offline compatibility
self.addEventListener('fetch', (event) => {
  // Let browser extensions and chrome-extension resources bypass the sw caching
  if (event.request.url.startsWith('http') || event.request.url.startsWith('https')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If valid response from network, save it in clone format
          if (response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, serve from local cache
          return caches.match(event.request);
        })
    );
  }
});
