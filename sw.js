/* OpenRutine Service Worker — caché estático, offline-first */
const VERSION = 'openrutine-v1';
const STATIC = [
  './', './index.html', './logo.svg', './manifest.webmanifest',
  './css/tokens.css', './css/base.css', './css/components.css', './css/animations.css',
  './assets/icon-192.png', './assets/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Red primero para el shell; caché como fallback offline. Nunca cacheamos llamadas al Coach ni a Supabase. */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase') || url.hostname.includes('workers.dev')) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});