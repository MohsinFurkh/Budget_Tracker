const CACHE_NAME = 'budget-tracker-v2';

// Relative paths so the app also works when hosted under a sub-path
// (e.g. GitHub Pages project sites).
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/config.js',
  './js/state.js',
  './js/storage.js',
  './js/data.js',
  './js/ui.js',
  './js/charts.js',
  './js/cloud.js',
  './js/firebase-config.js',
  './js/views/onboarding.js',
  './js/views/dashboard.js',
  './js/views/transactions.js',
  './js/views/analytics.js',
  './js/views/more.js'
];

// Third-party hosts whose responses we cache at runtime so the app
// works offline after the first load (Tailwind, Chart.js, icons, fonts).
const RUNTIME_CACHE_HOSTS = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(name => name !== CACHE_NAME)
        .map(name => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Never cache Firebase/Google auth or Firestore traffic
  if (url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  if (url.hostname.includes('firebaseapp.com') || url.hostname.includes('gstatic.com') && url.pathname.includes('firebasejs')) return;

  const isRuntimeHost = RUNTIME_CACHE_HOSTS.includes(url.hostname);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isRuntimeHost && !isSameOrigin) return;

  // Stale-while-revalidate: serve from cache, refresh in the background
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then(response => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
