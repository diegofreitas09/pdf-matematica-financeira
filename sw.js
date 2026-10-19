const CACHE='pdf-financeira-aurora-v9';
const ASSETS=['./','./index.html','./style.css','./script.js','./plataforma.html','./financeiro.html','./experience.js','./experience.css','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('pdf-financeira-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(event.request);
      if(response.ok)cache.put(event.request,response.clone()).catch(()=>{});
      return response;
    }catch(error){
      return (await cache.match(event.request,{ignoreSearch:true}))
        || (event.request.mode==='navigate'?await cache.match('./index.html'):Response.error());
    }
  })());
});

self.addEventListener("notificationclick",event=>{event.notification.close();const url=new URL(event.notification.data?.url||"./?revisar=1",self.registration.scope).href;event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(all=>{const active=all.find(c=>c.url.startsWith(self.registration.scope));return active?active.navigate(url).then(()=>active.focus()):clients.openWindow(url);}));});
