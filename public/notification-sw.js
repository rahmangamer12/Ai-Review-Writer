// Service Worker for AutoReview AI Notifications
// Handles background notifications even when app is closed

const CACHE_NAME = 'autoreview-notifications-v1';

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let notificationData = {
    title: 'AutoReview AI',
    body: 'You have a new notification',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: 'autoreview-notification',
    requireInteraction: false,
    data: {
      url: '/dashboard'
    }
  };

  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        tag: data.tag || notificationData.tag,
        data: { url: data.url || '/dashboard' }
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: notificationData.data
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/dashboard';

  // Handle action buttons
  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, url } = event.data.payload;
    
    self.registration.showNotification(title || 'AutoReview AI', {
      body: body || 'New notification',
      icon: icon || '/icon.png',
      badge: '/badge.png',
      tag: 'autoreview-message',
      requireInteraction: false,
      data: { url: url || '/dashboard' }
    });
  }
  
  // Handle ping from main app
  if (event.data && event.data.type === 'PING') {
    event.source.postMessage({ type: 'PONG', timestamp: Date.now() });
  }
});

// Sync event - handle background sync (for offline support)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-reviews') {
    event.waitUntil(
      // This would sync pending reviews when back online
      Promise.resolve()
    );
  }
});

// Periodic sync - for checking new reviews periodically
// Note: This requires 'periodic-background-sync' permission
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'check-reviews') {
    event.waitUntil(checkForNewReviews());
  }
});

// Function to check for new reviews (would connect to your API)
async function checkForNewReviews() {
  try {
    // This would be an API call to check for new reviews
    // For now, just log
    console.log('[SW] Checking for new reviews...');
  } catch (error) {
    console.error('[SW] Error checking reviews:', error);
  }
}

// Fetch event - for caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Cache strategy: Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache GET requests
          if (event.request.method === 'GET') {
            cache.put(event.request, responseToCache);
          }
        });
        
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

// Log when service worker is ready
console.log('[SW] AutoReview AI Notification Service Worker loaded');
