// This is needed for the TypeScript types
/// <reference lib="WebWorker" />

// Declare 'self' as a ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

// This line is automatically injected by vite-plugin-pwa
// It contains the list of all your app's files to cache for offline use
precacheAndRoute(self.__WB_MANIFEST || []);

cleanupOutdatedCaches();

// --- This is the new code for Push Notifications ---

// 1. Listen for a push message from the server
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }
  
  const data = event.data.json();
  const title = data.title || 'AfuChat';
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png', // Make sure you have an icon here in public/icons/
    badge: '/icons/icon-96x96.png',  // And here
    data: {
      url: data.url || '/', // We can send a URL to open on click
    },
  };

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Listen for a click on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  // Open the app or a specific URL
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
