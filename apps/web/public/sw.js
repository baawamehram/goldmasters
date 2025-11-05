const CACHE_NAME = 'goldmasters-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache API routes, authentication, or dynamic data
  // This ensures admin dashboard and database operations work in real-time
  const shouldNotCache = 
    url.pathname.startsWith('/api/') ||           // All API routes (including /api/v1/*)
    url.pathname.startsWith('/_next/data/') ||    // Next.js data fetching
    url.pathname.startsWith('/admin') ||          // Admin routes and pages
    url.pathname.startsWith('/auth') ||           // Auth routes
    url.pathname.startsWith('/login') ||          // Login routes
    url.pathname.startsWith('/checkout') ||       // Checkout routes
    request.method !== 'GET' ||                   // POST, PUT, DELETE, etc.
    url.origin !== location.origin;               // External requests

  // For non-cacheable requests, always go to network for fresh data
  if (shouldNotCache) {
    event.respondWith(fetch(request));
    return;
  }

  // For cacheable requests (static assets only), use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Only cache static assets (images, CSS, JS)
          const isStaticAsset = 
            url.pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|ico|woff|woff2|ttf)$/i);

          if (isStaticAsset) {
            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
          }

          return response;
        });
      })
  );
});
