/// <reference lib="webworker" />

const CACHE_NAME = 'petvida-v1';
const STATIC_CACHE = 'petvida-static-v1';
const DYNAMIC_CACHE = 'petvida-dynamic-v1';

// Arquivos para cachear imediatamente na instalação
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Skip waiting para ativar imediatamente
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Claim all clients imediatamente
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (exceto CDN do Firebase/fonts)
  if (!url.origin.includes(location.origin) && 
      !url.hostname.includes('firebaseio.com') &&
      !url.hostname.includes('googleapis.com') &&
      !url.hostname.includes('gstatic.com')) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (JS, CSS, images) - cache first
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      url.pathname.includes('/icons/') ||
      url.pathname.includes('/images/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - network first with offline fallback
  event.respondWith(networkFirst(request));
});

// Cache first strategy
async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache first failed, returning offline page');
    return caches.match('/index.html') || new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache');
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

async function syncReminders(): Promise<void> {
  // Sync reminders that were marked complete while offline
  // This would integrate with IndexedDB to get pending actions
  console.log('[SW] Syncing reminders...');
}

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: data.tag || 'petvida-notification',
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'Ver' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(
      data.title || 'PetVida',
      options
    )
  );
});

// Notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window
      return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(urlToOpen);
    })
  );
});

// Type declarations for service worker events
declare const self: ServiceWorkerGlobalScope;

interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<unknown>): void;
}

interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface SyncEvent extends Event {
  tag: string;
  waitUntil(fn: Promise<unknown>): void;
}

interface PushEvent extends Event {
  data: {
    json(): {
      title?: string;
      body?: string;
      tag?: string;
      data?: { url?: string };
    };
  };
}

interface NotificationEvent extends Event {
  notification: Notification;
  action: string;
}
