/* PDF Financeira — cache versionado, navegação offline correta e atualização segura. */
const CACHE='pdf-financeira-aurora-v26';
const PREFIX='pdf-financeira-';
const ASSETS=['./','./index.html','./vestibulares.html','./vestibulares.css','./vestibulares.js','./flashcards.html','./flashcards.css','./flashcards.js','./style.css','./script.js','./plataforma.html','./financeiro.html','./calculator-pro.js','./uece-financeira.html','./experience.js','./install.js','./study-reminders.html','./study-reminders.js','./experience.css','./revisao-avaliacao.html','./revisao-avaliacao.css','./revisao-avaliacao.js','./revisao-avaliacao.json','./voice-lookup.js','./voice-lookup.css','./desafios-pdf.js','./desafios-pdf.css','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const url=new URL(request.url);
    const isPage=request.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname.endsWith('/');
    const cached=await cache.match(request,{ignoreSearch:true});
    // Páginas usam rede primeiro para receber correções; recursos estáticos, cache primeiro.
    const isReviewData=url.pathname.endsWith('/revisao-avaliacao.json');
    if(!isPage&&!isReviewData&&cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok)cache.put(request,response.clone()).catch(()=>{});
      return response;
    }catch(error){
      if(cached)return cached;
      // Não mostrar a tela inicial no lugar de uma calculadora ou aula offline.
      if(isPage)return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sem conexão — PDF Matemática Financeira</title><body style="font:16px system-ui;padding:2rem;line-height:1.6"><h1>Você está sem conexão</h1><p>Esta página ainda não foi salva para uso offline. Reconecte-se e abra novamente.</p><button onclick="location.reload()">Tentar novamente</button></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      return Response.error();
    }
  })());
});
// O servidor envia alertas mesmo quando a janela estiver fechada, com permissão do usuário.
self.addEventListener('push', event => {
  let data={};
  try {data=event.data ? event.data.json() : {};} catch (_) { data={}; }
  const title=String(data.title||'PDF Financeira — hora de estudar').slice(0,130);
  const body=String(data.body||'Abra sua agenda de estudos e revise para o vestibular.').slice(0,280);
  const opts={
    body,icon:'./icon-192.png',badge:'./icon-192.png',
    tag:String(data.tag||'pdf-financeira-study').slice(0,130),renotify:true,
    vibrate:[160,90,160],
    data:{url:typeof data.url==='string'&&data.url.startsWith('/')?data.url:'/vestibulares.html'}
  };
  event.waitUntil(self.registration.showNotification(title,opts));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=new URL(event.notification.data?.url||'./?revisar=1',self.registration.scope).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(all=>{
    const active=all.find(c=>c.url.startsWith(self.registration.scope));
    return active?active.navigate(url).then(()=>active.focus()):clients.openWindow(url);
  }));
});
