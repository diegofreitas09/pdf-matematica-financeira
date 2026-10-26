/* PDF Financeira - Cadernos de desafios (A4, download real em PDF). */
(function () {
  'use strict';
  const screen = document.getElementById('screen');
  if (!screen || typeof BANK === 'undefined') return;

  const urlJsPdf = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js';
  const allTopics = typeof units !== 'undefined' ? units.map(u => u[0]) : [...new Set(BANK.map(q => q.topic))];
  let loadingLibrary = null;
  let lastContext = { question: null, pool: [] };
  let dialog;
  const byId = id => document.getElementById(id);
  const safe = str => String(str == null ? '' : str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const questionID = q => 'PDF-MF-' + String(q.id).padStart(4, '0');
  const difficulty = n => ({1:'Fácil',2:'Média',3:'Desafio'})[n] || 'Nível ' + n;

  // A fonte Helvetica dos PDFs preserva o português; símbolos não cobertos são escritos em notação linear.
  function pdfText(value) {
    return String(value == null ? '' : value)
      .replace(/[‐‑‒–—−]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/×/g, ' x ').replace(/÷/g, ' / ').replace(/≈/g, ' aprox. ')
      .replace(/≥/g, ' >= ').replace(/≤/g, ' <= ').replace(/≠/g, ' != ')
      .replace(/⇒|→/g, ' => ').replace(/⇔/g, ' <=> ')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/¹/g, '^1')
      .replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6')
      .replace(/₀/g, '0').replace(/₁/g, '1').replace(/₂/g, '2').replace(/₃/g, '3')
      .replace(/₄/g, '4').replace(/₅/g, '5').replace(/ₐ/g, 'a')
      .replace(/•|·/g, ' - ').replace(/\u00a0/g, ' ').replace(/[^\u0009\u000A\u000D\u0020-\u00FF]/g, '');
  }

  function ensureLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (loadingLibrary) return loadingLibrary;
    loadingLibrary = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = urlJsPdf;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => window.jspdf && window.jspdf.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('Biblioteca de PDF indisponível'));
      script.onerror = () => reject(new Error('Não foi possível carregar o gerador de PDF. Verifique a internet.'));
      document.head.appendChild(script);
    }).catch(error => { loadingLibrary = null; throw error; });
    return loadingLibrary;
  }

  function sorted(questions, order) {
    const unique = [...new Map(questions.filter(q => q && Number.isFinite(q.id)).map(q => [q.id,q])).values()];
    if (order === 'original') return unique.sort((a,b) => a.id - b.id);
    if (order === 'level') return unique.sort((a,b) => a.level - b.level || allTopics.indexOf(a.topic) - allTopics.indexOf(b.topic) || a.id - b.id);
    return unique.sort((a,b) => allTopics.indexOf(a.topic) - allTopics.indexOf(b.topic) || a.level - b.level || a.id - b.id);
  }

  function makePDF(questions, settings, JsPDF) {
    const list = sorted(questions, settings.order || 'topic');
    if (!list.length) throw new Error('Não há questões disponíveis para esta seleção.');
    const doc = new JsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    const W = 210, bottom = 278, margin = 16, innerWidth = W - margin*2;
    let y = 34, page = 1;
    function header() {
      doc.setFillColor(22,56,106); doc.rect(0,0,W,24,'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(14);
      doc.text('PDF  |  MATEMÁTICA FINANCEIRA',margin,10.5);
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.text('PREPARATÓRIO DIEGO FREITAS',margin,17.5);
      doc.setTextColor(37,55,79);
      y = 34;
    }
    function next() { doc.addPage(); page++; header(); }
    function ensure(height) { if (y + height > bottom) next(); }
    function textBlock(content, x, width, size=10.5, leading=5.1, weight='normal', color=[37,55,79]) {
      doc.setFont('helvetica',weight); doc.setFontSize(size); doc.setTextColor(...color);
      const rows = doc.splitTextToSize(pdfText(content),width);
      for (const row of rows) {
        ensure(leading);
        doc.text(row,x,y);
        y += leading;
      }
    }
    function topic(name) {
      ensure(19);
      y += 4;
      doc.setFillColor(230,241,254); doc.roundedRect(margin,y-6,innerWidth,11,2,2,'F');
      doc.setTextColor(27,82,145); doc.setFont('helvetica','bold'); doc.setFontSize(11);
      doc.text(pdfText(name).slice(0,65),margin+4,y+1);
      y += 13;
    }
    header();
    doc.setFont('helvetica','bold'); doc.setTextColor(23,67,119); doc.setFontSize(18);
    doc.text('CADERNO DE QUESTÕES DESAFIO',margin,y); y += 9;
    textBlock('Questões organizadas automaticamente, numeradas e identificadas pelo código permanente.',margin,innerWidth,9.5,5,'normal',[82,100,125]);
    y += 4;
    if (!settings.answers) {
      textBlock('Aluno(a): __________________________________  Turma: __________  Data: ___/___/______',margin,innerWidth,9.5,5);
      y += 3;
    }
    const summary = list.length + (list.length===1?' questão':' questões') + '  |  ' +
      (settings.order==='level'?'Ordem por dificuldade':settings.order==='original'?'Ordem do banco':'Agrupadas por assunto e dificuldade');
    textBlock(summary,margin,innerWidth,9,5,'bold',[26,96,160]); y += 5;

    let previousTopic = '';
    list.forEach((q,i) => {
      if (q.topic !== previousTopic && settings.order!=='original' && settings.order!=='level') { topic(q.topic); previousTopic=q.topic; }
      const stem = doc.splitTextToSize(pdfText(q.stem),innerWidth - 8);
      const opts = q.opts.flatMap(opt => doc.splitTextToSize(pdfText(opt),innerWidth-19));
      const predicted = 9 + stem.length*5.1 + opts.length*4.8 + 13;
      ensure(Math.min(predicted,65));
      doc.setTextColor(41,99,155); doc.setFont('helvetica','bold'); doc.setFontSize(8.6);
      doc.text('QUESTÃO ' + String(i+1).padStart(2,'0') + '  |  ' + questionID(q) + '  |  ' + pdfText(q.topic) + '  |  ' + difficulty(q.level),margin,y);
      y += 6;
      textBlock(q.stem,margin,innerWidth,10.4,5.15,'bold');
      y += 1.5;
      q.opts.forEach((opt,j) => {
        textBlock('ABCDE'[j] + ') ' + opt,margin+5,innerWidth-6,9.7,4.8);
      });
      y += 5;
      ensure(4);
      doc.setDrawColor(216,229,241); doc.line(margin,y-2,W-margin,y-2);
      y += 2;
    });

    if (settings.answerCard && !settings.answers) {
      next();
      doc.setFont('helvetica','bold');doc.setTextColor(23,67,119);doc.setFontSize(16);
      doc.text('CARTÃO-RESPOSTA',margin,y); y+=10;
      textBlock('Marque a letra da alternativa escolhida.',margin,innerWidth,9.7,5);
      y += 5;
      list.forEach((q,i) => {
        ensure(9);
        const col=i%2, x=margin+col*(innerWidth/2), lineY=y;
        doc.setTextColor(39,64,92);doc.setFont('helvetica','normal');doc.setFontSize(9.2);
        doc.text(String(i+1).padStart(2,'0')+'  A   B   C   D   E',x,lineY);
        if (col===1||i===list.length-1)y+=8;
      });
    }

    if (settings.answers) {
      next();
      doc.setFont('helvetica','bold');doc.setTextColor(23,67,119);doc.setFontSize(16);
      doc.text('GABARITO COMENTADO',margin,y);y+=9;
      textBlock('Confira as resoluções após realizar os exercícios.',margin,innerWidth,9.5,5);
      y+=6;
      let lastTopic='';
      list.forEach((q,i) => {
        if (q.topic!==lastTopic && settings.order==='topic') {topic(q.topic);lastTopic=q.topic;}
        ensure(18);
        const answer='ABCDE'[q.answer] || '?';
        textBlock(String(i+1).padStart(2,'0')+'  |  '+questionID(q)+'  |  RESPOSTA: '+answer+') '+(q.opts[q.answer]||''),margin,innerWidth,10.2,5.2,'bold',[25,93,150]);
        textBlock(q.explain || 'Comentário não disponível.',margin+4,innerWidth-4,9.4,5.0);
        y+=5;
      });
    }

    const total=doc.getNumberOfPages();
    for(let i=1;i<=total;i++){
      doc.setPage(i);
      doc.setDrawColor(212,225,238);doc.line(margin,285,W-margin,285);
      doc.setTextColor(102,116,137);doc.setFont('helvetica','normal');doc.setFontSize(8);
      doc.text('PDF - Preparatório Diego Freitas  |  Questões autorais para estudo',margin,290);
      doc.text('Pág. '+i+' / '+total,W-margin,290,{align:'right'});
    }
    doc.setProperties({title:'PDF Financeira - Questões Desafio',subject:'Caderno de questões e matemática financeira',author:'Preparatório Diego Freitas'});
    const filename='PDF_Financeira_Desafios_'+(list.length===1?questionID(list[0]):String(list.length)+'Questoes')+(settings.answers?'_Comentado':'')+'.pdf';
    doc.save(filename);
    return filename;
  }

  function selection() {
    const scope = byId('pdf-desafios-escopo').value;
    const topic = byId('pdf-desafios-assunto').value;
    const level = byId('pdf-desafios-nivel').value;
    let pool;
    if (scope === 'current') pool = lastContext.question ? [lastContext.question] : [];
    else if (scope === 'world') pool = lastContext.pool;
    else if (scope === 'answered') {
      const attempted = new Set((state.history || []).map(h => h.id));
      pool = BANK.filter(q => attempted.has(q.id));
    } else if (scope === 'errors') pool = typeof pendingErrors === 'function' ? pendingErrors() : [];
    else pool = BANK;
    if (topic !== 'all') pool = pool.filter(q => q.topic === topic);
    if (level !== 'all') pool = pool.filter(q => q.level === Number(level));
    return sorted(pool,byId('pdf-desafios-ordem').value);
  }

  function updateSelection() {
    const list=selection();
    const count=byId('pdf-desafios-contagem');
    count.textContent=list.length + (list.length===1?' questão pronta para o caderno.':' questões prontas para o caderno.');
    byId('pdf-desafios-baixar').disabled = !list.length;
    byId('pdf-desafios-imprimir').disabled = !list.length;
  }

  function openOrganizer(scope='all') {
    if(!dialog) return;
    const select=byId('pdf-desafios-escopo');
    select.querySelector('[value="current"]').disabled = !lastContext.question;
    select.querySelector('[value="world"]').disabled = !lastContext.pool.length;
    if(scope==='world'&&!lastContext.pool.length)scope='all';
    if(scope==='current'&&!lastContext.question)scope='all';
    select.value=scope;
    byId('pdf-desafios-assunto').value='all';
    byId('pdf-desafios-nivel').value='all';
    updateSelection();
    if(!dialog.open)dialog.showModal();
  }

  async function download(list,opts,button) {
    if(!list.length){alert('Não há questões nesta seleção.');return;}
    const status=byId('pdf-desafios-status');
    const label=button?.textContent;
    if(button){button.disabled=true;button.textContent='Preparando seu PDF...';}
    if(status)status.textContent='Organizando as questões e criando o PDF em A4...';
    try {
      const JsPDF=await ensureLibrary();
      const file=makePDF(list,opts,JsPDF);
      if(status)status.textContent='PDF gerado: '+file+'. Confira a pasta de Downloads.';
    } catch(err) {
      if(status)status.textContent='Não foi possível baixar agora. Use a opção "Abrir para imprimir" ou tente novamente com internet.';
      console.error('[PDF Financeira] Erro ao exportar caderno:',err);
      if (!dialog || !dialog.open) alert('Não foi possível baixar agora. Confira a conexão e tente novamente ou abra o organizador para imprimir.');
    } finally {
      if(button){button.disabled=false;button.textContent=label;}
    }
  }
  function printPreview(list,opts) {
    if(!list.length)return;
    if(typeof buildHandout === 'function' && typeof pdfPrint === 'function') {
      pdfPrint(buildHandout(sorted(list,opts.order),opts.answers));
    } else {
      alert('Prévia indisponível. Use o botão Baixar PDF.');
    }
  }

  function installOrganizer() {
    dialog=document.createElement('dialog');
    dialog.id='pdf-desafios-organizador';
    dialog.setAttribute('aria-labelledby','pdf-desafios-titulo');
    dialog.innerHTML=
      '<div class="pdf-desafios-modal-head"><div><div class="pdf-desafios-tag">PDF FINANCEIRA · MATERIAL PARA ESTUDAR</div><h2 id="pdf-desafios-titulo">Monte seu caderno de desafios</h2><p>Escolha os exercícios e deixe a plataforma organizar as páginas para você.</p></div><button class="pdf-desafios-x" type="button" id="pdf-desafios-fechar" aria-label="Fechar">✕</button></div>'+
      '<div class="pdf-desafios-select-grid">'+
      '<label>Quais questões?<select id="pdf-desafios-escopo"><option value="all">Todos os 110 desafios</option><option value="world">Mundo / missão atual</option><option value="current">Somente a questão atual</option><option value="answered">Questões que já respondi</option><option value="errors">Pendentes do Caderno de Erros</option></select></label>'+
      '<label>Assunto<select id="pdf-desafios-assunto"><option value="all">Todos os assuntos</option>'+allTopics.map(t=>'<option value="'+safe(t)+'">'+safe(t)+'</option>').join('')+'</select></label>'+
      '<label>Dificuldade<select id="pdf-desafios-nivel"><option value="all">Todos os níveis</option><option value="1">Fácil</option><option value="2">Média</option><option value="3">Desafio</option></select></label>'+
      '<label>Organização automática<select id="pdf-desafios-ordem"><option value="topic">Por assunto e dificuldade</option><option value="level">Por nível de dificuldade</option><option value="original">Por numeração original</option></select></label></div>'+
      '<label class="pdf-desafios-check"><input type="checkbox" id="pdf-desafios-respostas"> Incluir gabarito comentado ao final</label>'+
      '<label class="pdf-desafios-check"><input type="checkbox" id="pdf-desafios-cartao" checked> Adicionar cartão-resposta (sem gabarito)</label>'+
      '<p id="pdf-desafios-contagem" class="pdf-desafios-count"></p>'+
      '<div class="pdf-desafios-actions"><button class="primary" type="button" id="pdf-desafios-baixar">⬇ Baixar PDF (.pdf)</button><button class="secondary" type="button" id="pdf-desafios-imprimir">Abrir para imprimir</button></div>'+
      '<p id="pdf-desafios-status" class="pdf-desafios-status" aria-live="polite"></p>';
    document.body.appendChild(dialog);
    byId('pdf-desafios-fechar').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    dialog.querySelectorAll('select,input').forEach(el=>el.addEventListener('change',updateSelection));
    byId('pdf-desafios-baixar').addEventListener('click',e=>{
      const opts={order:byId('pdf-desafios-ordem').value,answers:byId('pdf-desafios-respostas').checked,answerCard:byId('pdf-desafios-cartao').checked};
      download(selection(),opts,e.currentTarget);
    });
    byId('pdf-desafios-imprimir').addEventListener('click',()=>{
      printPreview(selection(),{order:byId('pdf-desafios-ordem').value,answers:byId('pdf-desafios-respostas').checked});
    });
  }

  function addControls() {
    if(!document.getElementById('screen'))return;
    const activeExercise = typeof exercise !== 'undefined' && exercise && exercise.pool && exercise.pool[exercise.index];
    const activeExam = typeof exam !== 'undefined' && exam && exam.pool && exam.pool[exam.index];
    const active = activeExercise ? activeExercise.pool[activeExercise.index] : activeExam ? activeExam.pool[activeExam.index] : null;
    if(active && screen.querySelector('.question') && !screen.querySelector('.pdf-desafios-atividade')){
      lastContext={question:active,pool:activeExercise?activeExercise.pool:activeExam.pool};
      const box=document.createElement('section');
      box.className='pdf-desafios-atividade';
      box.innerHTML='<div class="pdf-desafios-atividade-title">📄 LEVE ESTE DESAFIO PARA ESTUDAR</div>'+
        '<div class="pdf-desafios-actions"><button class="secondary" type="button" data-pdf-current>⬇ Baixar questão em PDF</button>'+
        '<button class="secondary" type="button" data-pdf-world>Baixar desafios desta missão</button>'+
        '<a href="#pdf-desafios-organizador" class="pdf-desafios-link" data-pdf-organizar>Organizar meu caderno →</a></div>'+
        '<p class="pdf-desafios-hint">O PDF será numerado e formatado em A4, sem mostrar a resposta antes da sua tentativa.</p>';
      const question=screen.querySelector('.question');
      question.insertAdjacentElement('afterend',box);
      box.querySelector('[data-pdf-current]').onclick=e=>download([active],{order:'original',answers:false,answerCard:false},e.currentTarget);
      box.querySelector('[data-pdf-world]').onclick=e=>download(lastContext.pool,{order:'topic',answers:false,answerCard:true},e.currentTarget);
      box.querySelector('[data-pdf-organizar]').onclick=e=>{e.preventDefault();openOrganizer('world');};
      return;
    }
    if (!active) lastContext={question:null,pool:[]};
    if(screen.querySelector('.hero') && !screen.querySelector('.pdf-desafios-chamada') && !active) {
      const call=document.createElement('section');
      call.className='pdf-desafios-chamada';
      call.innerHTML='<div class="pdf-desafios-chamada-icon" aria-hidden="true">📘</div>'+
        '<div class="pdf-desafios-chamada-text"><strong>Questões Desafio em PDF</strong><span>A plataforma organiza seus exercícios por assunto e dificuldade, com opção de gabarito separado.</span></div>'+
        '<button type="button" class="primary" data-pdf-abrir>Organizar e baixar PDF</button>';
      const hero=screen.querySelector('.hero');
      hero.insertAdjacentElement('afterend',call);
      call.querySelector('[data-pdf-abrir]').onclick=()=>openOrganizer('all');
      if (screen.querySelector('.mission')) {
        screen.querySelectorAll('.mission').forEach(card=>{
          const btn=card.querySelector('[data-mission]');
          if(!btn||card.querySelector('[data-pdf-mission]'))return;
          const dl=document.createElement('button');
          dl.type='button';dl.className='secondary pdf-desafios-mission-button';
          dl.dataset.pdfMission=btn.dataset.mission;dl.textContent='⬇ Baixar desafios deste mundo';
          dl.onclick=e=>download(BANK.filter(q=>q.topic===dl.dataset.pdfMission),{order:'topic',answers:false,answerCard:true},e.currentTarget);
          card.appendChild(dl);
        });
      }
    }
  }

  installOrganizer();
  // A plataforma troca o HTML da atividade a cada questão; recoloca os botões sem perder respostas/progresso.
  const observer=new MutationObserver(()=>addControls());
  observer.observe(screen,{childList:true});
  addControls();
  window.PDFChallengeExport={open:openOrganizer,download:(questions,options)=>download(questions,options || {order:'topic',answers:false,answerCard:true})};
}());
