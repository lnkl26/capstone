const VERSION = 'v11';  //bump this when we make big changes, if u have a weird bug, bump this and refresh
const CACHE = `static-${VERSION}`;  //unique cache name per version
const ASSETS = [  //files to be available offline immediately
  './', './index.html',  
  './swConfig.js', 
  './scripts.js', 
  './style.css', 
  './manifest.json',  
  './htmlPages/focusMode.html',
  './htmlPages/foodMed.html',
  './htmlPages/productive.html',
  './htmlPages/settings.html',
  './htmlPages/task.html',
  './htmlPages/trackDiet.html',
  './htmlPages/trackMed.html',
  './medLog.js'
  ];

//install precache core assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
//remove old caches and take control
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});
//fetch 
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return; //don’t cache
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;
  //HTML attepmts network first, fallback to cache, final fallback index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        caches.open(CACHE).then(c => c.put(e.request, r.clone())); //keep a copy
        return r;
      }).catch(() => caches.match(e.request) || caches.match('/index.html'))
    );
    return;
  }
  //same w origin static files checks cache first, then network to store a copy for next visit
  if (sameOrigin) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached ||
        fetch(e.request).then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          return r;
       })
     )
    );
  }
});