const CACHE_NAME = 'xoleric-v2-cache';
const urlsToCache = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap',
  'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Kesh ochildi');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Keshdan o'qiydi
        }
        return fetch(event.request); // Internetdan o'qiydi
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Eskirgan keshni tozalaydi
          }
        })
      );
    })
  );
});
 
