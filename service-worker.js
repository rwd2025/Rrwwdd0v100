const CACHE='rwd-ba001-v5-finished-20260619';
const ASSETS=['./','./index.html','./style.css','./ba001-finish.css','./app.js','./ba001-finish.js','./manifest.json','./assets/icon-192.svg','./assets/icon-512.svg','./icon-192.svg','./icon-512.svg'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>cache.addAll(['./','./index.html','./style.css','./app.js']))));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return resp;}).catch(()=>caches.match(event.request).then(resp=>resp||caches.match('./index.html'))));});
