/* PDF Financeira - agenda de vestibulares e estudos, horários de Brasília. */
(function(){
'use strict';
const EVENTS=[
['unifor-271','Unifor — Vestibular presencial 2027.1','Unifor','2026-09-27','08:00','Prova realizada em 27/09/2026.','Matemática, porcentagem e redação.','https://unifor.br/-/inscricoes-para-o-processo-seletivo-2027.1-da-unifor-comecam-em-setembro','exam'],
['christus-med-271','Unichristus — Vestibular Medicina 2027.1','Unichristus','2026-10-13','08:00','Prova já realizada em 13/10/2026.','Matemática e Ciências da Natureza.','https://www.unichristus.edu.br/processos-seletivos-medicina-2027-1/','exam'],
['uece-1-271','UECE 2027.1 — 1ª fase','UECE','2026-10-18','09:15','Primeira fase já realizada.','Conhecimentos gerais e provas anteriores.','https://www2.cev.uece.br/vest/20271/inscricao','exam'],
['christus-inscr-271','Unichristus — fim das inscrições 2027.1','Unichristus','2026-10-27','18:00','Prazo oficial de inscrição no vestibular geral.','Confira a inscrição e revise matemática e redação.','https://www.unichristus.edu.br/wp-content/uploads/2026/09/EditalN39-VestibularGeral-2027.1-UniversidadeChristus.pdf','deadline'],
['uece-musica-271','UECE 2027.1 — exame oral de Música','UECE','2026-10-30','08:30','Exame específico dos candidatos a Música.','Preparação para a prova oral de habilidade específica.','https://www2.cev.uece.br/vest/20271/inscricao','exam'],
['christus-geral-271','Unichristus — Vestibular Geral 2027.1','Unichristus','2026-10-31','14:30','Prova de conhecimentos gerais e redação no Campus Dom Luís.','Matemática básica, porcentagem, interpretação e redação.','https://www.unichristus.edu.br/wp-content/uploads/2026/09/EditalN39-VestibularGeral-2027.1-UniversidadeChristus.pdf','exam'],
['christus-result-271','Unichristus — resultado 2027.1','Unichristus','2026-11-06','14:00','Resultado previsto a partir das 14h.','Consulte a lista de aprovados e classificáveis.','https://www.unichristus.edu.br/wp-content/uploads/2026/09/EditalN39-VestibularGeral-2027.1-UniversidadeChristus.pdf','result'],
['enem-2026-1','ENEM 2026 — 1º dia','ENEM','2026-11-08','13:30','Linguagens, Ciências Humanas e Redação. Confirme o horário no Inep.','Interpretação, Linguagens, Humanas e Redação.','https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/orientacoes/cronograma','exam'],
['enem-2026-2','ENEM 2026 — 2º dia','ENEM','2026-11-15','13:30','Matemática e Ciências da Natureza. Confirme o horário no Inep.','Matemática, porcentagem, juros, gráficos e Ciências da Natureza.','https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/orientacoes/cronograma','exam'],
['uece-2-271-a','UECE 2027.1 — 2ª fase, 1º dia','UECE','2026-12-06','09:15','Prova das 9h15 às 13h15.','Redação e conteúdos específicos do curso.','https://www2.cev.uece.br/vest/20271/inscricao','exam'],
['uece-2-271-b','UECE 2027.1 — 2ª fase, 2º dia','UECE','2026-12-07','09:15','Prova das 9h15 às 13h15.','Exercícios específicos, questões anteriores e revisão.','https://www2.cev.uece.br/vest/20271/inscricao','exam']
].map(x=>({id:x[0],title:x[1],org:x[2],date:x[3],time:x[4],info:x[5],focus:x[6],url:x[7],kind:x[8]}));
const KEY='pdf-vestibulares-planner-v1', API='/api/vestibulares-push', $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toMs=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const dayDiff=(a,b)=>Math.round((toMs(b)-toMs(a))/86400000);
const isoOffset=(s,n)=>new Date(toMs(s)+n*86400000).toISOString().slice(0,10);
const today=()=>{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return parts.year+'-'+parts.month+'-'+parts.day;};
const brDate=s=>s.split('-').reverse().join('/');
let state={selected:null,lead:[14,7,3,1],hour:9,custom:[],sessions:[]};
try{const data=JSON.parse(localStorage.getItem(KEY)||'{}');if(data&&typeof data==='object'){state={...state,...data};}}catch(_){}
if(!Array.isArray(state.custom))state.custom=[];
if(!Array.isArray(state.sessions))state.sessions=[];
if(!Array.isArray(state.lead))state.lead=[14,7,3,1];
if(!Array.isArray(state.selected))state.selected=EVENTS.filter(e=>e.kind==='exam'&&e.date>=today()).map(e=>e.id);
const allEvents=()=>EVENTS.concat(state.custom.map(e=>({...e,org:'Minha prova',kind:'exam',url:'',info:'Data adicionada manualmente.'}))).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
const trackable=()=>allEvents().filter(e=>e.date>=today()&&e.kind!=='result');
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
function status(msg){$('va-push-status').textContent=msg;}
function renderEvents(){
 const filter=$('va-events-filter').value,list=allEvents().filter(e=>filter==='all'||(filter==='future'?e.date>=today():e.date<today()));
 const futures=allEvents().filter(e=>e.date>=today());$('va-upcoming-count').textContent=futures.length;$('va-next-count').textContent=futures.length?dayDiff(today(),futures[0].date):'—';
 $('va-events').innerHTML=list.length?list.map(e=>{
  const d=dayDiff(today(),e.date),old=d<0;
  const mon=new Intl.DateTimeFormat('pt-BR',{month:'short',timeZone:'UTC'}).format(new Date(e.date+'T12:00:00Z')).replace('.','').toUpperCase();
  const stamp=old?'Encerrado':d===0?'Hoje':d===1?'Amanhã':'Faltam '+d+' dias';
  const type=e.kind==='deadline'?'Inscrições':e.kind==='result'?'Resultado':'Prova';
  const end=e.url?'<a class="va-source" href="'+esc(e.url)+'" rel="noopener noreferrer" target="_blank">Fonte oficial ↗</a>':
   '<button class="va-text-btn" type="button" data-remove="'+esc(e.id)+'">Excluir minha prova</button>';
  return '<article class="va-event '+(old?'past':'')+'"><div class="va-date"><strong>'+esc(e.date.slice(-2))+'</strong><small>'+mon+'</small></div><div class="va-event-content"><h3>'+esc(e.title)+'</h3><div class="va-event-meta">'+type+' • '+brDate(e.date)+' • '+esc(e.time)+'</div><p>'+esc(e.info)+'</p><span class="va-status-pill">'+stamp+'</span> '+end+'</div></article>';
 }).join(''):'<p class="va-empty">Nenhum evento neste filtro.</p>';
 document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{
  state.custom=state.custom.filter(e=>e.id!==b.dataset.remove);
  state.selected=state.selected.filter(id=>id!==b.dataset.remove);save();render();syncPush();
 }));
}
function renderSelections(){
 const available=trackable();
 $('va-exam-choices').innerHTML=available.map(e=>'<label><input type="checkbox" data-exam="'+esc(e.id)+'" '+(state.selected.includes(e.id)?'checked':'')+'> <span>'+esc(e.title)+' <small style="display:block;color:var(--muted)">'+brDate(e.date)+'</small></span></label>').join('')||'<p>Cadastre uma nova prova para começar.</p>';
 document.querySelectorAll('[data-exam]').forEach(input=>input.addEventListener('change',()=>{
  state.selected=[...document.querySelectorAll('[data-exam]:checked')].map(el=>el.dataset.exam);save();syncPush();
 }));
 const select=$('va-plan-event'),current=select.value;
 select.innerHTML=available.filter(e=>e.kind==='exam').map(e=>'<option value="'+esc(e.id)+'">'+esc(e.title)+' — '+brDate(e.date)+'</option>').join('');
 if([...select.options].some(x=>x.value===current))select.value=current;
}
function renderSessions(){
 state.sessions=state.sessions.filter(s=>s&&s.id&&s.date&&s.time&&s.title).slice(0,60);
 const ordered=state.sessions.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 $('va-session-count').textContent=ordered.filter(s=>s.date>=today()).length;
 $('va-study-sessions').innerHTML=ordered.length?ordered.map(s=>'<div class="va-session"><div><b>'+esc(s.title)+'</b><span>'+brDate(s.date)+' às '+esc(s.time)+(s.date<today()?' · data passada':'')+'</span></div><button type="button" data-study-remove="'+esc(s.id)+'">Excluir</button></div>').join(''):'<p class="va-empty">Nenhuma sessão cadastrada. Agende sua primeira revisão.</p>';
 document.querySelectorAll('[data-study-remove]').forEach(b=>b.addEventListener('click',()=>{state.sessions=state.sessions.filter(s=>s.id!==b.dataset.studyRemove);save();renderSessions();syncPush();}));
}
function render(){renderEvents();renderSelections();renderSessions();}
function prefs(){
 return {hour:state.hour,daysBefore:state.lead,
  events:allEvents().filter(e=>e.date>=today()&&state.selected.includes(e.id)&&e.kind!=='result').map(e=>({id:e.id,date:e.date,title:e.title,focus:e.focus})),
  sessions:state.sessions.filter(s=>s.date>=today()).map(s=>({id:s.id,title:s.title,date:s.date,time:s.time}))};
}
async function getSubscription(){if(!('serviceWorker' in navigator))return null;const sw=await navigator.serviceWorker.ready;return sw.pushManager?.getSubscription()||null;}
async function syncPush(){
 try {
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const subscription=await getSubscription();if(!subscription)return;
  const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:subscription.toJSON(),settings:prefs()})});
  if(!response.ok)throw Error('Falha ao sincronizar');
  $('va-disable').hidden=false;status('✓ Seus avisos estão ativos. Datas e horários sincronizados com o celular.');
 }catch(e){console.warn(e);status('Os dados foram salvos neste aparelho, mas não foi possível sincronizar os alertas. Tente novamente com internet.');}
}
function keyBytes(key){const padded=key+'='.repeat((4-key.length%4)%4);return Uint8Array.from(atob(padded.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
async function activate(){
 const b=$('va-activate');b.disabled=true;
 try{
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))throw Error('Push não é compatível com este navegador. Use a exportação para seu calendário.');
  const permission=await Notification.requestPermission();
  if(permission!=='granted')throw Error('Permissão negada. Autorize notificações nas configurações do navegador ou celular.');
  status('Registrando celular para avisos automáticos...');
  const r=await fetch(API,{cache:'no-store'});if(!r.ok)throw Error('Servidor de avisos indisponível.');
  const config=await r.json();if(!config.publicKey)throw Error('Chave de notificações não configurada.');
  const sw=await navigator.serviceWorker.ready;let sub=await sw.pushManager.getSubscription();
  if(!sub)sub=await sw.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(config.publicKey)});
  const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub.toJSON(),settings:prefs()})});
  if(!response.ok)throw Error('Não foi possível salvar os avisos no servidor.');
  $('va-disable').hidden=false;
  status('✓ Ativado! O servidor enviará lembretes nos dias selecionados. Som e vibração dependem das configurações do celular.');
 }catch(e){console.error(e);status('⚠ '+e.message);}
 finally{b.disabled=false;}
}
async function disable(){
 try{const sub=await getSubscription();if(sub){const resp=await fetch(API,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub.toJSON()})});if(!resp.ok)throw Error('Não foi possível desativar alertas no servidor.');await sub.unsubscribe();}
 $('va-disable').hidden=true;status('Alertas do servidor desativados neste aparelho. Os estudos continuam salvos.');
 }catch(e){status('⚠ '+e.message);}
}
function saveConfig(){state.hour=Number($('va-hour').value)||9;state.lead=[...document.querySelectorAll('[name=lead]:checked')].map(e=>Number(e.value)).sort((a,b)=>b-a);save();syncPush();}
function escapeICS(s){return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
function eventICS(e,days){
 const alarms=days.map(n=>'BEGIN:VALARM\r\nTRIGGER:-P'+n+'D\r\nACTION:DISPLAY\r\nDESCRIPTION:'+escapeICS('Hora de revisar para '+e.title)+'\r\nEND:VALARM').join('\r\n');
 return 'BEGIN:VEVENT\r\nUID:'+escapeICS(e.id)+'@pdf-financeira\r\nDTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')+'\r\nDTSTART;TZID=America/Sao_Paulo:'+e.date.replace(/-/g,'')+'T'+e.time.replace(':','')+'00\r\nDURATION:PT1H\r\nSUMMARY:'+escapeICS(e.title)+'\r\nDESCRIPTION:'+escapeICS(e.focus)+'\r\n'+(alarms?alarms+'\r\n':'')+'END:VEVENT';
}
function exportICS(){
 const e=allEvents().filter(x=>x.date>=today()&&state.selected.includes(x.id)).map(x=>eventICS(x,state.lead));
 const sessions=state.sessions.filter(s=>s.date>=today()).map(x=>eventICS({...x,focus:'Sessão de estudo agendada na PDF Financeira.'},[0]));
 const payload=e.concat(sessions);
 if(!payload.length){status('Escolha uma prova ou programe estudos para gerar o calendário.');return;}
 const body='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Preparatório PDF//Agenda Financeira//PT\r\nCALSCALE:GREGORIAN\r\nX-WR-TIMEZONE:America/Sao_Paulo\r\n'+payload.join('\r\n')+'\r\nEND:VCALENDAR\r\n';
 const url=URL.createObjectURL(new Blob([body],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='PDF_Agenda_de_Vestibulares.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 status('✓ Calendário gerado. Abra o arquivo .ics no calendário do celular e confirme a importação.');
}
function newStudy(title,date,time){return{id:'sess-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),title:title.slice(0,90),date,time};}
function addStudy(e){
 e.preventDefault();
 const title=$('va-study-title').value.trim(),date=$('va-study-date').value,time=$('va-study-hour').value;
 if(!title||date<today()){status('Informe um assunto e uma data a partir de hoje.');return;}
 if(state.sessions.length>=60){status('Limite de 60 sessões; exclua sessões para liberar espaço.');return;}
 state.sessions.push(newStudy(title,date,time));save();$('va-study-title').value='';renderSessions();syncPush();status('✓ Estudo agendado para '+brDate(date)+' às '+time+'.');
}
function planStudy(){
 const ex=allEvents().find(x=>x.id===$('va-plan-event').value);if(!ex||ex.date<=today()){status('Selecione uma prova futura.');return;}
 const topics=ex.org==='ENEM'?['Matemática básica e porcentagem','Interpretação de gráficos','Juros e taxas','Questões ENEM anteriores','Simulado cronometrado','Revisão do caderno de erros']:
 ex.org==='UECE'?['Funções, exponenciais e logaritmos','Juros compostos','Questões da UECE','Porcentagem e matemática básica','Simulado UECE','Revisão final por assunto']:
 ['Matemática básica','Porcentagem e descontos','Juros simples e compostos','Interpretação e redação','Simulado do vestibular','Revisão dos erros'];
 let count=0;
 [14,10,7,5,3,1].forEach((n,i)=>{const date=isoOffset(ex.date,-n),title=topics[i]+' — '+ex.org;
  if(date<today()||state.sessions.length>=60||state.sessions.some(s=>s.date===date&&s.title===title))return;
  state.sessions.push(newStudy(title,date,$('va-study-hour').value));count++;
 });
 save();renderSessions();syncPush();status(count?'✓ '+count+' sessões distribuídas antes de '+brDate(ex.date)+'.':'Não há sessões novas para gerar nessa data.');
}
function addCustom(e){
 e.preventDefault();
 const title=$('va-custom-title').value.trim(),date=$('va-custom-date').value,focus=$('va-custom-focus').value.trim()||'Matemática financeira, redação e questões anteriores.';
 if(!title||date<today()){status('Escolha uma prova futura e informe o nome.');return;}
 if(state.custom.length>=20){status('Limite de 20 provas pessoais atingido.');return;}
 const id='custom-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 state.custom.push({id,title,date,time:'09:00',focus});state.selected.push(id);save();e.target.reset();render();syncPush();status('✓ Prova incluída na sua agenda e lembretes.');
}
async function initPush(){
 try{const sub=await getSubscription();if(sub&&Notification.permission==='granted'){$('va-disable').hidden=false;await syncPush();}
 else if(!('Notification' in window))status('Este navegador não oferece notificações push; você pode importar o calendário.');
 }catch(_){}
}
function init(){
 const d=today();$('va-study-date').min=d;$('va-custom-date').min=d;$('va-study-date').value=d;
 $('va-hour').value=String(state.hour||9);
 document.querySelectorAll('[name=lead]').forEach(e=>e.checked=state.lead.includes(Number(e.value)));
 render();
 $('va-events-filter').addEventListener('change',renderEvents);
 $('va-hour').addEventListener('change',saveConfig);
 document.querySelectorAll('[name=lead]').forEach(e=>e.addEventListener('change',saveConfig));
 $('va-activate').addEventListener('click',activate);$('va-disable').addEventListener('click',disable);
 $('va-export').addEventListener('click',exportICS);
 $('va-study-form').addEventListener('submit',addStudy);$('va-auto-plan').addEventListener('click',planStudy);
 $('va-custom-form').addEventListener('submit',addCustom);
 $('va-clear-past').addEventListener('click',()=>{state.sessions=state.sessions.filter(s=>s.date>=today());save();renderSessions();syncPush();});
 initPush();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();