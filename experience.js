/* PDF Financeira — melhoria de aulas, PDF e estudo guiado. */
(function(){
"use strict";
const byId=id=>document.getElementById(id);
const enc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
if(byId("screen")){legacy();}else{homepage();}
function legacy(){
  if(typeof showBook!=="function"||typeof theory!=="function"||typeof caderno!=="function")return;
  const chapters={"Conceitos":6,"Domínio":6,"Propriedades":6,"Equações":6,"Juros compostos":5,"Prazo e logaritmos":6,"Taxas":2,"Aplicações":7};
  const tips={
    "Conceitos":"logₐ(b) = x significa aˣ = b. Identifique a base e o logaritmando.",
    "Domínio":"A base deve ser maior que 0 e diferente de 1; o logaritmando deve ser positivo.",
    "Propriedades":"Produto de argumentos vira soma de logs; quociente vira diferença.",
    "Equações":"Reescreva na forma exponencial e confira as restrições.",
    "Juros compostos":"M = C(1+i)ⁿ. Taxa e prazo devem usar a mesma unidade.",
    "Prazo e logaritmos":"Use n = log(M/C) / log(1+i) para encontrar o prazo, quando i>0.",
    "Taxas":"Em juros compostos, taxas equivalentes usam os fatores (1+i).",
    "Aplicações":"Organize capital, juros, prazo e fluxos antes do cálculo."
  };
  let topic="";
  const oldShow=showBook,oldTheory=theory,oldCaderno=caderno,oldChoose=choose,oldBiblioteca=biblioteca;
  const scroll=()=>requestAnimationFrame(()=>byId("pdfBookContent")?.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));
  function study(t){topic=t;navigate("teoria");}
  function practice(){
    if(!topic)return;
    const root=byId("pdfBookContent")?.querySelector(".bookBody");
    if(!root)return;
    root.querySelector("#recover-practice")?.remove();
    const n=pendingErrors().filter(q=>q.topic===topic).length;
    const card=document.createElement("section");
    card.id="recover-practice";card.className="recover-card";
    card.innerHTML='<strong>PASSO 2 · EXERCITAR</strong><h3>Praticar '+enc(topic)+'</h3><p>'+n+' questão(ões) para refazer neste assunto.</p><div class="controls"><button class="primary" id="recover-go">Resolver questões →</button><button class="secondary" id="recover-back">Caderno de Erros</button></div>';
    root.appendChild(card);
    byId("recover-go").onclick=()=>{const qs=pendingErrors().filter(q=>q.topic===topic);if(qs.length)reviewPool(qs);else startPractice(topic);};
    byId("recover-back").onclick=()=>navigate("caderno");
  }
  window.showBook=function(n){
    const had=Boolean(byId("pdfBookContent")?.dataset.chapter);
    oldShow(n);
    const root=byId("pdfBookContent");
    if(root)root.dataset.chapter=String(n+1);
    if(byId("chapter-select"))byId("chapter-select").value=String(n);
    if(byId("chapter-current"))byId("chapter-current").textContent="Capítulo "+(n+1)+" de "+PDF_BOOK.length+": "+PDF_BOOK[n].title;
    practice();
    if(had)scroll();
  };
  window.theory=function(){
    oldTheory();
    const nav=document.querySelector(".bookNav");if(!nav)return;
    const chooser=document.createElement("div");chooser.className="chapter-chooser";
    chooser.innerHTML='<label for="chapter-select">Selecione o conteúdo da aula</label><select id="chapter-select">'+PDF_BOOK.map((L,i)=>'<option value="'+i+'">'+(i+1)+'. '+enc(L.title)+'</option>').join("")+'</select><p id="chapter-current" aria-live="polite"></p>';
    nav.before(chooser);
    byId("chapter-select").value=String(selectedBook);
    byId("chapter-select").onchange=e=>showBook(Number(e.target.value));
    byId("chapter-current").textContent="Capítulo "+(selectedBook+1)+" de "+PDF_BOOK.length+": "+PDF_BOOK[selectedBook].title;
    if(topic){
      const panel=document.createElement("section");panel.className="recover-card";
      panel.innerHTML='<strong>PASSO 1 · ESTUDAR</strong><h3>Entenda '+enc(topic)+'</h3><p>'+enc(tips[topic]||"Leia a teoria e o exemplo resolvido.")+'</p>';
      chooser.before(panel);
      showBook(Math.min(PDF_BOOK.length-1,chapters[topic]??6));
      scroll();
    }
  };
  window.caderno=function(){
    topic="";oldCaderno();
    const pending=pendingErrors();
    const chosen=recommendations().filter(r=>r.pending>0)[0]?.topic||"Conceitos";
    const hero=byId("screen")?.querySelector(".hero");
    if(hero){
      const card=document.createElement("section");card.className="recover-card";
      card.innerHTML='<strong>SEU PLANO DE RECUPERAÇÃO</strong><h2>1. Aprender · 2. Ver o exemplo · 3. Refazer</h2><p>'+pending.length+' questões aguardam revisão. Primeiro estude o assunto para depois praticar.</p><button class="primary" id="recover-start">Estudar '+enc(chosen)+' →</button>';
      hero.after(card);byId("recover-start").onclick=()=>study(chosen);
    }
    document.querySelectorAll("[data-topic]").forEach(b=>{b.disabled=false;b.textContent="Estudar e refazer";b.onclick=()=>study(b.dataset.topic);});
    document.querySelectorAll("[data-error]").forEach(b=>{
      const q=pending.find(x=>x.id===Number(b.dataset.error));
      if(q){b.textContent="Ver a explicação primeiro";b.onclick=()=>study(q.topic);}
    });
  };
  window.choose=function(choice){
    const q=typeof exercise==="undefined"?null:exercise?.pool?.[exercise.index];
    const locked=typeof exercise!=="undefined"&&Boolean(exercise?.locked);
    oldChoose(choice);
    if(q&&!locked&&choice!==q.answer&&byId("feedback")){
      const b=document.createElement("button");b.type="button";b.className="secondary";
      b.textContent="Estudar "+q.topic+" antes de refazer";
      b.onclick=()=>study(q.topic);
      byId("feedback").append(b);
    }
  };
  window.biblioteca=function(){
    oldBiblioteca();
    const b=byId("download-pdf");
    if(b){b.textContent="Abrir PDF para impressão (A4)";const p=document.createElement("p");p.className="muted";p.textContent="O documento traz questões agrupadas por conteúdo, identificação por ID e cartão-resposta. No celular, use a opção Imprimir > Salvar como PDF.";b.closest(".panel")?.append(p);}
  };
  window.buildHandout=function(questions,answers=false){
    const qs=[...questions].sort((a,b)=>a.topic.localeCompare(b.topic,"pt-BR")||a.id-b.id);
    const topics=new Map();qs.forEach(q=>{if(!topics.has(q.topic))topics.set(q.topic,[]);topics.get(q.topic).push(q);});
    const heading=answers?"Gabarito comentado":"Caderno de questões";
    const sections=[...topics].map(([name,list])=>'<section><h2>'+enc(name)+' <small>· '+list.length+' questões</small></h2>'+list.map(q=>'<article class="question"><div class="qid">'+enc(questionId(q))+' · Nível '+q.level+'</div><p><b>'+(qs.indexOf(q)+1)+'.</b> '+enc(q.stem)+'</p><div class="opts">'+q.opts.map((opt,i)=>'<div>'+("ABCDE"[i])+') '+enc(opt)+'</div>').join("")+'</div>'+(answers?'<div class="solution"><b>Resposta: '+("ABCDE"[q.answer])+') '+enc(q.opts[q.answer])+'</b><p>'+enc(q.explain)+'</p></div>':"")+'</article>').join("")+'</section>').join("");
    const grid=answers?"":'<section class="card"><h2>Cartão-resposta</h2><p>Marque uma alternativa por questão.</p><div class="answers">'+qs.map((q,i)=>'<div><b>'+String(i+1).padStart(2,"0")+'</b> <small>'+enc(questionId(q))+'</small> Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ</div>').join("")+'</div></section>';
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+heading+'</title><style>@page{size:A4;margin:16mm 14mm}*{box-sizing:border-box}body{color:#22364d;background:#fff;font:11pt/1.5 Arial,Helvetica,sans-serif;margin:0 auto;max-width:800px}h1{color:#1b5995;font-size:24pt;margin:0 0 5px}h2{font-size:13pt;color:#1b5995;background:#eef5fd;border-left:4px solid #3177b2;padding:9px;break-after:avoid}h2 small{font-size:9pt;font-weight:normal;color:#627487}header{border-bottom:3px solid #3177b2;padding-bottom:13px;margin-bottom:20px}header p,.end{font-size:9pt;color:#5d6d81}.student{font-size:10pt;padding:12px 0}.question{break-inside:avoid-page;padding:11px 2px;border-bottom:1px solid #dbe3ec}.qid{font-size:9pt;color:#316795;font-weight:bold}.question p{margin:6px 0}.opts{padding-left:14px;font-size:10pt}.opts div{padding:2px 0}.solution{border-left:3px solid #3177b2;background:#f1f6fc;padding:9px;margin-top:10px}.solution p{margin:4px 0}.card{break-before:page}.answers{display:grid;grid-template-columns:1fr 1fr;gap:8px}.answers div{border:1px solid #d9e3ed;padding:8px;break-inside:avoid;font-size:9pt}.answers small{color:#607489}.toolbar{padding:12px;background:#edf5fc;margin-bottom:20px}.toolbar button{border:0;padding:12px;background:#2b6bac;color:white;font-weight:bold;border-radius:8px}@media screen{body{padding:22px}}@media print{.toolbar{display:none}}</style></head><body><div class="toolbar"><button type="button" onclick="window.print()">Imprimir / Salvar como PDF</button> Escolha Salvar como PDF na janela de impressão.</div><header><h1>PDF Matemática Financeira</h1><b>'+heading+'</b><p>Preparatório Diego Freitas · '+qs.length+' questões · Formato A4</p>'+(answers?"":'<p class="student">Aluno(a): _________________________________ Turma: ______ Data: ___/___/_____</p>')+'</header>'+sections+grid+'<p class="end">PDF — Preparatório Diego Freitas · Questões com identificadores permanentes.</p></body></html>';
  };
  window.pdfPrint=function(content){
    const w=window.open("","_blank");
    if(!w){alert("A prévia foi bloqueada. Permita abrir nova aba para salvar o PDF.");return;}
    w.document.open();w.document.write(content);w.document.close();w.focus();
  };
}
function homepage(){
  const slot=document.querySelector(".overview");if(!slot)return;
  const card=document.createElement("section");card.className="reminder-panel container";
  card.innerHTML='<div><span class="reminder-kicker">HORA DE EVOLUIR</span><h2 id="reminder-title">Sua próxima conquista espera por você.</h2><p id="reminder-text">Dedique alguns minutos a uma aula e avance na trilha.</p></div><div class="reminder-actions"><button class="button button-primary" id="reminder-study">Estudar agora →</button><button class="button button-outline" id="reminder-permission">Permitir avisos</button></div><small id="reminder-help">Avisos somente após autorização. Para horários com o aplicativo fechado, será necessário um serviço de push.</small>';
  slot.after(card);
  const ranges=[27,41,51,61,76,90,100,110],names=["Conceitos","Domínio","Propriedades","Equações","Juros compostos","Prazo e logaritmos","Taxas","Aplicações"];
  const key="pdf-financeira-reminder-consent",last="pdf-financeira-last-notification";
  function pending(){
    try{
      const history=JSON.parse(localStorage.getItem("pdf-logquest-v2")||"{}").history||[];
      const lastById=new Map();history.forEach(h=>lastById.set(Number(h.id),h));
      const count=new Map();let total=0;
      for(const [id,h] of lastById){if(id>=1&&id<=110&&!h.ok){total++;const t=names[ranges.findIndex(n=>id<=n)];count.set(t,(count.get(t)||0)+1);}}
      const topic=[...count].sort((a,b)=>b[1]-a[1])[0]?.[0]||"Conceitos";
      return {total,topic,time:Math.max(0,...history.map(h=>Date.parse(h.time)||0))};
    }catch{return {total:0,topic:"Conceitos",time:0};}
  }
  const permission=byId("reminder-permission"),btn=byId("reminder-study"),help=byId("reminder-help");
  function render(){
    const p=pending();byId("reminder-title").textContent=p.total?p.total+" questão(ões) no Caderno de Erros":"Sua próxima conquista espera por você";
    byId("reminder-text").textContent=p.total?"Comece por "+p.topic+". Estude o assunto e depois refaça os erros.":"Uma aula curta hoje faz diferença.";
    btn.textContent=p.total?"Estudar "+p.topic+" →":"Abrir aulas →";
    const available=("Notification" in window)&&("serviceWorker" in navigator)&&window.isSecureContext;
    permission.disabled=!available;
    if(!available)permission.textContent="Avisos indisponíveis";
    else if(Notification.permission==="granted"&&localStorage.getItem(key)==="yes")permission.textContent="Avisos autorizados";
    else if(Notification.permission==="denied")permission.textContent="Permissão bloqueada";
    return p;
  }
  btn.onclick=()=>{const p=pending();if(typeof openStage==="function")openStage({route:p.total?"caderno":"teoria",title:p.total?"Caderno de Erros":"Aulas"},btn);};
  permission.onclick=async()=>{
    try{
      const result=await Notification.requestPermission();
      if(result==="granted"){localStorage.setItem(key,"yes");help.textContent="Avisos autorizados: aparecem ao retornar ao site quando houver pendências."; }
      else help.textContent="Tudo bem! Você continuará vendo o lembrete dentro do aplicativo.";
    }catch{help.textContent="Não foi possível ativar os avisos.";}
    render();
  };
  async function onReturn(){
    const p=render();
    if(!p.total||!p.time||Date.now()-p.time<86400000)return;
    if(!("Notification" in window)||Notification.permission!=="granted"||localStorage.getItem(key)!=="yes")return;
    if(Date.now()-Number(localStorage.getItem(last)||0)<86400000)return;
    try{
      const reg=await navigator.serviceWorker.ready;
      await reg.showNotification("PDF Financeira — sua revisão espera",{body:p.total+" questão(ões) para refazer. Comece por "+p.topic+".",icon:"./icon-192.png",tag:"pdf-financeira-revisao",data:{url:"./?revisar=1"}});
      localStorage.setItem(last,String(Date.now()));
    }catch(e){console.warn("Aviso não mostrado:",e);}
  }
  window.addEventListener("pageshow",render);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)render();});
  render();
  if(new URLSearchParams(location.search).has("revisar"))setTimeout(()=>btn.click(),350);else setTimeout(onReturn,1200);
}
})();