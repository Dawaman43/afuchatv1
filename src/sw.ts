// This is needed for the TypeScript types
/// <reference lib="WebWorker" />

// Declare 'self' as a ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// App version for cache management
const APP_VERSION = '2.0.0';
const CACHE_PREFIX = 'afuchat';

// Cache names
const CACHES = {
  precache: `${CACHE_PREFIX}-precache-v${APP_VERSION}`,
  runtime: `${CACHE_PREFIX}-runtime-v${APP_VERSION}`,
  pages: `${CACHE_PREFIX}-pages-v${APP_VERSION}`,
  static: `${CACHE_PREFIX}-static-v${APP_VERSION}`,
  images: `${CACHE_PREFIX}-images-v${APP_VERSION}`,
  api: `${CACHE_PREFIX}-api-v${APP_VERSION}`,
  fonts: `${CACHE_PREFIX}-fonts-v${APP_VERSION}`,
  offline: `${CACHE_PREFIX}-offline-v${APP_VERSION}`,
};

// Offline fallback page content
const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AfuChat - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0F1114;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      stroke: #00C2CB;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 12px;
      color: #ffffff;
    }
    p {
      color: rgba(255,255,255,0.7);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    button {
      background: #00C2CB;
      color: #000;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    button:active { transform: scale(0.98); }
    .cached-pages {
      margin-top: 32px;
      text-align: left;
    }
    .cached-pages h3 {
      font-size: 14px;
      color: rgba(255,255,255,0.5);
      margin-bottom: 12px;
    }
    .cached-pages a {
      display: block;
      color: #00C2CB;
      text-decoration: none;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
    </div>
    <h1>You're Offline</h1>
    <p>Don't worry! AfuChat works offline. Your cached content is still available.</p>
    <button onclick="window.location.reload()">Try Again</button>
    <div class="cached-pages" id="cachedPages"></div>
  </div>
  <script>
    // Show cached pages
    if ('caches' in window) {
      caches.open('${CACHES.pages}').then(cache => {
        cache.keys().then(keys => {
          if (keys.length > 0) {
            const container = document.getElementById('cachedPages');
            container.innerHTML = '<h3>Available Offline:</h3>';
            keys.slice(0, 5).forEach(req => {
              const url = new URL(req.url);
              const a = document.createElement('a');
              a.href = url.pathname;
              a.textContent = url.pathname === '/' ? 'Home' : url.pathname.replace(/^\//, '').replace(/-/g, ' ');
              container.appendChild(a);
            });
          }
        });
      });
    }
  </script>
</body>
</html>
`;

// Precache app shell and static assets
// This line is automatically injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// Clean up old caches
cleanupOutdatedCaches();

// --- App Shell Strategy ---
// Cache the main app shell for instant loading
const appShellUrls = ['/', '/index.html'];

// --- Navigation Handler (App Shell) ---
// Always serve cached app shell for navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: CACHES.pages,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
    networkTimeoutSeconds: 3, // Fallback to cache after 3 seconds
  })
);

// --- Static Assets (JS, CSS) - Cache First ---
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: CACHES.static,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// --- Images - Cache First with longer expiry ---
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHES.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// --- Fonts - Cache First (long-lived) ---
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: CACHES.fonts,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// --- Google Fonts ---
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: CACHES.fonts,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// --- Supabase Storage (User uploads, avatars) ---
registerRoute(
  ({ url }) =>
    url.hostname.includes('supabase.co') &&
    (url.pathname.includes('/storage/') || url.pathname.includes('/object/')),
  new StaleWhileRevalidate({
    cacheName: CACHES.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// --- Supabase API (REST) - Stale While Revalidate ---
registerRoute(
  ({ url }) =>
    url.hostname.includes('supabase.co') &&
    url.pathname.includes('/rest/') &&
    !url.pathname.includes('/realtime/') &&
    !url.pathname.includes('/auth/'),
  new StaleWhileRevalidate({
    cacheName: CACHES.api,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
  })
);

// --- CDN Resources ---
registerRoute(
  ({ url }) =>
    url.origin.includes('cdn') ||
    url.origin.includes('unpkg') ||
    url.origin.includes('jsdelivr') ||
    url.origin.includes('cloudflare'),
  new CacheFirst({
    cacheName: CACHES.static,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// --- Offline Fallback Handler ---
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests for offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to get from network first
          const networkResponse = await fetch(event.request);
          
          // If successful, cache and return
          if (networkResponse.ok) {
            const cache = await caches.open(CACHES.pages);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
          
          throw new Error('Network response not ok');
        } catch (error) {
          // Network failed, try cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Try to serve cached index.html for SPA routing
          const indexResponse = await caches.match('/index.html');
          if (indexResponse) {
            return indexResponse;
          }

          // Last resort: serve offline page
          return new Response(OFFLINE_PAGE, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
          });
        }
      })()
    );
  }
});

// --- Service Worker Messages ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: APP_VERSION });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  // Handle notification message from main thread
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      ...options,
    });
  }
});

// --- Push Event - Handle push notifications ---
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {
    title: 'AfuChat',
    body: 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    url: '/notifications',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
      requireInteraction: true,
    })
  );
});

// --- Notification Click ---
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: urlToOpen });
            return;
          }
        }
        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// --- Install Event ---
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + APP_VERSION);

  event.waitUntil(
    Promise.all([
      // Cache critical app shell
      caches.open(CACHES.pages).then((cache) => {
        return cache.addAll(appShellUrls).catch((err) => {
          console.log('[SW] Failed to cache app shell:', err);
        });
      }),
      // Cache offline page
      caches.open(CACHES.offline).then((cache) => {
        return cache.put(
          '/offline.html',
          new Response(OFFLINE_PAGE, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        );
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// --- Activate Event ---
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v' + APP_VERSION);

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const validCaches = Object.values(CACHES);
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName.startsWith(CACHE_PREFIX) && !validCaches.includes(cacheName)
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

// --- Background Sync (for offline actions) ---
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPendingPosts());
  }
});

async function syncPendingPosts() {
  // Get pending posts from IndexedDB and sync them
  console.log('[SW] Syncing pending posts...');
  // Implementation would depend on your IndexedDB setup
}

// --- Periodic Background Sync ---
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'update-content') {
    event.waitUntil(updateCachedContent());
  }
});

async function updateCachedContent() {
  // Refresh cached content in background
  console.log('[SW] Updating cached content...');
  try {
    const cache = await caches.open(CACHES.api);
    // Refresh important API endpoints
  } catch (error) {
    console.log('[SW] Failed to update content:', error);
  }
}

console.log('[SW] Service worker loaded v' + APP_VERSION);
