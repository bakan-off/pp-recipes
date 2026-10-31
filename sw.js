/* Generated from content hash; network-first documents and code, cached images. */
const CACHE='pp-recipes-2144e47c4b13';
const CORE=['./index.html','./assets/app.js','./assets/styles.css','./assets/personal.js','./assets/recipes-data.js','./assets/image-map.js','./assets/fonts/editorial.woff','./assets/fonts/sans.woff','./assets/icons/icon-192.png','./assets/icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pp-recipes-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 const key=new Request(u.origin+u.pathname),image=/\.(webp|png|jpg|woff|woff2)$/.test(u.pathname);
 e.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(key);if(image&&hit)return hit;try{const response=await fetch(e.request);if(response.ok){await cache.put(key,response.clone());const keys=await cache.keys();if(keys.length>220)await cache.delete(keys.find(k=>/\.(webp|jpg|png)$/.test(k.url))||keys[0]);}return response;}catch{if(hit)return hit;if(e.request.mode==='navigate')return new Response('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Нет подключения</title><body style="font:18px/1.6 system-ui;padding:24px"><h1>Этот рецепт ещё не сохранён</h1><p>Подключитесь к сети и откройте его один раз. Уже открытые рецепты доступны офлайн.</p><a href="index.html">К сохранённому каталогу</a></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}});return Response.error();}})());
});