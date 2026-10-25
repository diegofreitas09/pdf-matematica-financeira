'use strict';
(function(){
  let deferredPrompt=null;
  const dialog=document.getElementById('install-dialog');
  if(!dialog)return;
  const native=document.getElementById('install-native');
  const info=document.getElementById('install-info');
  const platforms=[...document.querySelectorAll('[data-install-platform]')];
  const installed=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  function selectPlatform(value){
    platforms.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.installPlatform===value)));
    document.getElementById('install-android').hidden=value!=='android';
    document.getElementById('install-ios').hidden=value!=='ios';
    native.hidden=value!=='android'||!deferredPrompt||installed;
    document.getElementById('install-installed').hidden=!installed;
    info.textContent=installed?'Você pode continuar estudando normalmente.':'';
  }
  function open(){selectPlatform(isIOS?'ios':'android');if(!dialog.open)dialog.showModal();}
  document.querySelectorAll('[data-open-install]').forEach(b=>b.addEventListener('click',open));
  document.getElementById('install-close')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  platforms.forEach(b=>b.addEventListener('click',()=>selectPlatform(b.dataset.installPlatform)));
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();deferredPrompt=event;
    if(dialog.open&&document.getElementById('install-android').hidden===false)native.hidden=false;
  });
  native.addEventListener('click',async()=>{
    if(!deferredPrompt){info.textContent='Abra o menu do Chrome e escolha Instalar app ou Adicionar à tela inicial.';return;}
    const prompt=deferredPrompt;deferredPrompt=null;native.hidden=true;
    try{await prompt.prompt();const choice=await prompt.userChoice;
      info.textContent=choice?.outcome==='accepted'?'Instalação solicitada. Confirme as instruções do navegador.':'Instalação cancelada. Você poderá instalar depois pelo menu do Chrome.';
    }catch(e){info.textContent='Use o menu do Chrome para instalar o aplicativo.';}
  });
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;native.hidden=true;info.textContent='Aplicativo instalado com sucesso!';});
})();
