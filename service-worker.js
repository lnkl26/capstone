const VERSION = 'v31.8.0';  //bump this when we make big changes, if u have a weird bug, bump this and refresh
const CACHE = `static-${VERSION}`;  //unique cache name per version
const ASSETS = [  //files to be available offline immediately
'./',
  './index.html',
  './manifest.json',
  './scripts.js',
  './swConfig.js',
  './firebase.js',
  './favicon.ico',
  './404.html',

  './assets/bgimg/fmbg.png',
  './assets/bgimg/fmbgd.jpg', 
  './assets/bgimg/logo.png',
  './assets/bgimg/mmbg.png',
  './assets/bgimg/mmbgd.jpg',
  './assets/bgimg/pmbg.png',
  './assets/bgimg/pmbgd.jpg',
  './assets/bgimg/smbg.png',
  './assets/bgimg/smbgd.jpg', 

  './cssStyles/diet.css',
  './cssStyles/focusmode.css',
  './cssStyles/medLog.css',
  './cssStyles/menu.css',
  './cssStyles/profile.css',
  './cssStyles/reminder.css',
  './cssStyles/task.css',

  './htmlPages/focusMode.html',
  './htmlPages/foodMed.html',
  './htmlPages/productive.html',
  './htmlPages/profile.html',
  './htmlPages/reminder.html',
  './htmlPages/settings.html',
  './htmlPages/task.html',
  './htmlPages/trackDiet.html',
  './htmlPages/trackMed.html',

  './jsFiles/dietLog.js',
  './jsFiles/focusmode.js',
  './jsFiles/medLog.js',
  './jsFiles/profile.js',
  './jsFiles/reminder.js',
  './jsFiles/routine.js',
  './jsFiles/task.js',
  './jsFiles/tasks.json'
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
        const clone = r.clone(); //keep a copy
        caches.open(CACHE).then(c => c.put(e.request, clone)); 
        return r;
      }).catch(() => caches.match(e.request) || caches.match('./index.html'))
    );
    return;
  }
  //same w origin static files checks cache first, then network to store a copy for next visit
  if (sameOrigin) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached ||
        fetch(e.request).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
            return r;
       })
     )
    );
  }
});
