importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBwS099Ju1BtbBFoUPJuhBnx4BrZPCZU4s',
  authDomain: 'petvid-82a98.firebaseapp.com',
  projectId: 'petvid-82a98',
  storageBucket: 'petvid-82a98.firebasestorage.app',
  messagingSenderId: '880010060804',
  appId: '1:880010060804:web:9a54a7c4d85485c6df0151',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'PetVida Care', {
    body,
    icon: '/logo.png',
    // Carried through to the click handler so the open can be attributed to
    // the kind of reminder that triggered it.
    data: { reminderType: (payload.data && payload.data.reminderType) || 'unknown' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // The service worker has no access to the app's analytics module, so the
  // open is tagged on the URL and reported by src/lib/pushTracking.ts once the
  // app boots. The params are stripped there so a refresh never double-counts.
  const reminderType = (event.notification.data && event.notification.data.reminderType) || 'unknown';
  const target = `/reminders?src=push&rtype=${encodeURIComponent(reminderType)}`;
  event.waitUntil(self.clients.openWindow(target));
});

// --- PWA offline caching ---
// This is the same file used for FCM background push (above), reused here so
// only one service worker is ever registered for scope '/' — registering a
// second file at the same scope would silently replace this one and break push.
// Bumped when this file changes so the activate handler evicts the previous
// cache and clients don't keep serving assets from the old service worker.
const CACHE_NAME = 'petvida-cache-v3';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    // '/' is intentionally NOT precached here — caching it at install time
    // would pin whatever build happened to be live during that install,
    // and navigations would then need the network-first fetch below to
    // ever see a newer deploy.
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['/manifest.json', '/logo.png', OFFLINE_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Firebase Auth/Hosting reserved routes must never be intercepted — letting
  // the SW touch these breaks auth popup/redirect flows.
  if (url.pathname.startsWith('/__/')) return;

  // Navigation (HTML) requests: always try the network first so a fresh
  // deploy is visible on the very next load, without the user needing to
  // clear the cache. Cache the result only as an offline fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Hashed Vite build output (/assets/*-<hash>.js|css): the URL itself
  // changes on every new build, so a cached copy is always safe — cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else (public images, manifest.json, favicon, etc.) has no
  // hash in its URL, so a stale cached copy would never self-correct.
  // Stale-while-revalidate: serve the cache instantly, refresh it in the background.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
