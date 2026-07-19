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
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/reminders'));
});

// --- PWA offline caching ---
// This is the same file used for FCM background push (above), reused here so
// only one service worker is ever registered for scope '/' — registering a
// second file at the same scope would silently replace this one and break push.
const CACHE_NAME = 'petvida-cache-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['/', '/manifest.json', '/logo.png', OFFLINE_URL]))
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
        .catch(() => cached || caches.match(OFFLINE_URL));
      return cached || networkFetch;
    })
  );
});
