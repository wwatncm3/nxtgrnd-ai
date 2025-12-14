// NxtGrnd AI Service Worker
// Provides offline capability and caching

const CACHE_NAME = 'nxtgrnd-ai-v1';
const RUNTIME_CACHE = 'nxtgrnd-runtime-v1';

// Assets to cache on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, then cache for API calls; cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip POST requests - Cache API doesn't support them
  if (request.method !== 'GET') {
    return;
  }

  // Skip Cognito auth requests - they shouldn't be cached
  if (url.hostname.includes('cognito-idp') || url.hostname.includes('cognito-identity')) {
    return;
  }

  // Handle API requests (GET only) - network first with cache fallback
  if (url.pathname.includes('/api/') ||
      url.hostname.includes('execute-api.us-east-1.amazonaws.com') ||
      url.hostname.includes('remotive.com') ||
      url.hostname.includes('arbeitnow.com')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets - cache first
  if (request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Network first strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline JSON response for API calls
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are currently offline. Data may be outdated.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
      }
    }).catch(() => {});

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network and cache both failed:', request.url);
    return new Response('', { status: 404 });
  }
}

// Navigation strategy (for page loads)
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, returning cached index');
    const cachedResponse = await caches.match('/index.html');

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return basic offline page
    return new Response(getOfflinePage(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(() => null);

  return cachedResponse || networkPromise;
}

// Basic offline page HTML
function getOfflinePage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NxtGrnd AI - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      opacity: 0.9;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    button {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      color: #667eea;
      background: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Don't worry, NxtGrnd AI will reconnect automatically when you're back online.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
  `;
}

// Handle push notifications from server (if implemented later)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = { title: 'NxtGrnd AI', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: data,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  if (data && data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync (for when coming back online)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // This could sync local changes to the server when back online
  console.log('[SW] Syncing notifications...');
}

console.log('[SW] Service Worker loaded');
