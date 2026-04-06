// AutoReview AI - Main Service Worker (PWA)
// Version: 1.0.2 - Fixed for all devices (iOS, Android, Desktop)

const CACHE_NAME = 'autoreview-ai-v1.0.2';
const RUNTIME_CACHE = 'autoreview-runtime-v1.0.2';
const IMAGE_CACHE = 'autoreview-images-v1.0.2';

const CACHE_VERSION = '1.0.2';

console.log('[SW] AutoReview AI Service Worker v' + CACHE_VERSION + ' loading...');

const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/reviews',
  '/analytics',
  '/settings',
  '/offline',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + CACHE_VERSION + '...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets...');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Some precache failed:', err);
        });
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping wait');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v' + CACHE_VERSION + '...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        console.log('[SW] Current caches:', cacheNames);
        
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('autoreview-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE &&
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  const requestOrigin = self.location ? self.location.origin : 'unknown';
  const urlOrigin = url.origin;

  if (urlOrigin !== requestOrigin && urlOrigin !== 'null') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE)
        .then((cache) => cache.match(request))
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(IMAGE_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              return new Response(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect fill="#0a0a0f" width="400" height="300"/><text fill="#6366f1" x="50%" y="50%" text-anchor="middle" dy=".3em">Image Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            });
        })
    );
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/offline');
            });
        })
    );
    return;
  }

  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  if (url.pathname === '/sw.js' || url.pathname === '/manifest.json') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => {
            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-reviews') {
    event.waitUntil(syncPendingReviews());
  }
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'AutoReview AI',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'autoreview-notification',
    data: { url: '/dashboard' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: notificationData.data
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});

async function syncPendingReviews() {
  try {
    console.log('[SW] Syncing pending reviews...');
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      console.log('[SW] Sync successful');
    } else {
      console.error('[SW] Sync failed:', response.status);
    }
  } catch (error) {
    console.error('[SW] Sync error:', error);
    throw error;
  }
}

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
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

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] AutoReview AI Service Worker loaded - v' + CACHE_VERSION);
