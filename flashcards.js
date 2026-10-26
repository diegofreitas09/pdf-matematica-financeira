/* Flashcards — PDF Matemática Financeira. Conteúdo autoral; sem bibliotecas externas. */
(function () {
  'use strict';

  const DECK_GROUPS = [
    {
      id: 'porcentagem', title: 'Porcentagem', cards: [
        ['O que significa 25%?', 'Significa 25 partes de cada 100. Em decimal, 25% = 0,25.'],
        ['Quanto é 20% de R$ 150?', 'R$ 30,00. Calcule 150 × 0,20 = 30.'],
        ['Um produto de R$ 80 aumenta 10%. Qual o novo preço?', 'R$ 88,00. O aumento é R$ 8,00; então 80 + 8 = 88.'],
        ['Um produto de R$ 200 tem 15% de desconto. Quanto custa?', 'R$ 170,00. Desconto: 200 × 0,15 = 30; preço: 200 − 30.'],
        ['Qual fator multiplicativo representa aumento de 8%?', '1,08. Multiplicar o preço inicial por 1,08 acrescenta 8%.'],
        ['Qual fator representa desconto de 20%?', '0,80. Após o desconto, você paga 80% do valor original.'],
        ['Aumentar 20% e depois dar desconto de 20% anula a mudança?', 'Não. Os fatores são 1,20 × 0,80 = 0,96: sobra 96% do valor inicial.'],
        ['Um preço passa de R$ 100 para R$ 125. Qual a variação?', 'Aumento de 25%, pois (125 − 100) ÷ 100 = 0,25.']
      ]
    },
    {
      id: 'taxas', title: 'Taxas e equivalências', cards: [
        ['O que significa uma taxa de 2% ao mês?', 'Uma taxa de 2% por período mensal, aplicada à base definida pelo regime de juros.'],
        ['Em juros simples, 1% ao mês corresponde a qual taxa proporcional anual?', '12% ao ano: 1% × 12 meses. Isso é proporcionalidade no regime simples.'],
        ['Em juros compostos, 1% ao mês equivale a quanto ao ano?', 'Aproximadamente 12,68% ao ano: (1,01)^12 − 1.'],
        ['Qual taxa mensal proporcional a 24% ao ano, em juros simples?', '2% ao mês, pois 24% ÷ 12 = 2%.'],
        ['Qual taxa mensal é equivalente a 12% efetivos ao ano, em juros compostos?', 'Aproximadamente 0,95% ao mês: (1,12)^(1/12) − 1.'],
        ['Qual a diferença entre taxa nominal e taxa efetiva?', 'A nominal é a taxa declarada; a efetiva reflete o efeito da capitalização no período.'],
        ['Como escrever 3,5% na forma decimal?', '0,035. Basta dividir 3,5 por 100.'],
        ['Qual cuidado é essencial ao comparar duas taxas?', 'Usar o mesmo período e considerar o regime: simples ou composto.']
      ]
    },
    {
      id: 'simples', title: 'Juros simples', cards: [
        ['Qual é a fórmula dos juros simples?', 'J = C × i × t, com i em decimal e t no período da taxa.'],
        ['Como calcular o montante em juros simples?', 'M = C + J = C × (1 + i × t).'],
        ['R$ 1.000 rendem 2% ao mês por 3 meses em juros simples. Quais juros?', 'R$ 60,00: J = 1.000 × 0,02 × 3.'],
        ['R$ 500 a 5% ao mês por 4 meses, em juros simples. Qual montante?', 'R$ 600,00: J = 500 × 0,05 × 4 = 100; M = 600.'],
        ['Em juros simples, como cresce o montante ao longo do tempo?', 'De forma linear, quando a taxa e o capital permanecem constantes.'],
        ['Em juros simples, os juros incidem sobre qual valor?', 'Sobre o capital inicial, não sobre os juros acumulados.'],
        ['Um capital dobra em 10 meses, a juros simples. Qual a taxa mensal?', '10% ao mês: 2C = C(1 + 10i), então i = 0,10.'],
        ['R$ 1.200 a 1,5% ao mês por 2 meses: quanto rende em juros simples?', 'R$ 36,00: J = 1.200 × 0,015 × 2.']
      ]
    },
    {
      id: 'compostos', title: 'Juros compostos', cards: [
        ['Qual a fórmula do montante em juros compostos?', 'M = C × (1 + i)^t, com taxa e prazo na mesma unidade.'],
        ['R$ 1.000 rendem 10% ao ano por 2 anos. Qual montante composto?', 'R$ 1.210,00: M = 1.000 × 1,10².'],
        ['O que são juros sobre juros?', 'São juros calculados sobre o saldo já acrescido dos juros anteriores.'],
        ['Com mesma taxa positiva e vários períodos, qual regime tende a render mais?', 'Para períodos inteiros acima de 1, os juros compostos superam os simples.'],
        ['R$ 500 a 2% ao mês por 3 meses, em juros compostos. Qual montante?', 'Aproximadamente R$ 530,60: 500 × 1,02³ = 530,604.'],
        ['R$ 1.000 crescem 10% por dois períodos. Quanto se ganha no 2º?', 'R$ 110,00. No 2º período, 10% incidem sobre R$ 1.100.'],
        ['Como descobrir apenas os juros compostos após calcular o montante?', 'Subtraia o capital inicial: J = M − C.'],
        ['Por que não posso misturar taxa ao mês com prazo em anos?', 'Porque a unidade da taxa deve coincidir com o número de períodos do expoente.']
      ]
    },
    {
      id: 'financiamentos', title: 'Descontos e financiamentos', cards: [
        ['Qual fórmula traz um valor futuro ao presente, em juros compostos?', 'VP = VF ÷ (1 + i)^t, para uma taxa i por período.'],
        ['Uma parcela de R$ 1.100 vence em um mês. A 10% ao mês, qual valor presente?', 'R$ 1.000,00: VP = 1.100 ÷ 1,10.'],
        ['Um produto de R$ 2.000 tem desconto à vista de 10%. Qual o preço?', 'R$ 1.800,00: 2.000 × 0,90.'],
        ['“Sem juros” no parcelamento sempre significa melhor negócio?', 'Não. Compare o preço parcelado com o desconto à vista e seu custo de oportunidade.'],
        ['Qual a diferença entre desconto comercial e desconto racional simples?', 'No comercial, a taxa é aplicada ao valor nominal; no racional, ao valor presente.'],
        ['O que acontece com parcelas futuras ao antecipar o pagamento?', 'Em geral, calcula-se o valor presente descontando os juros futuros, conforme o contrato.'],
        ['O que os juros representam em um empréstimo?', 'O custo do dinheiro emprestado ao longo do tempo, sem contar possíveis tarifas.'],
        ['Posso somar parcelas futuras diretamente para obter o preço à vista?', 'Não quando há juros. Primeiro traga cada parcela a valor presente.']
      ]
    },
    {
      id: 'amortizacao', title: 'Amortização', cards: [
        ['O que é amortizar uma dívida?', 'É reduzir o principal, ou seja, diminuir o saldo devedor.'],
        ['De que é formada uma prestação de financiamento?', 'Em geral: amortização + juros; pode também incluir seguros, taxas e encargos.'],
        ['Qual característica define o sistema SAC?', 'Amortização constante do principal em cada período; prestações normalmente decrescentes.'],
        ['Qual é a principal característica da Tabela Price?', 'Prestações iguais, em condições de taxa fixa e sem mudanças nos encargos.'],
        ['Por que os juros normalmente diminuem no SAC?', 'Porque incidem sobre um saldo devedor que diminui a cada amortização.'],
        ['Saldo de R$ 1.000 com amortização de R$ 200: qual saldo final?', 'R$ 800,00, desconsiderando novos juros, tarifas ou liberações.'],
        ['Se a prestação foi R$ 350 e R$ 90 eram juros, quanto amortizou?', 'R$ 260,00, se não houver outros encargos: 350 − 90.'],
        ['Antecipar amortizações pode reduzir o custo total?', 'Sim. A redução antecipada do principal pode diminuir os juros futuros.']
      ]
    },
    {
      id: 'logs', title: 'Exponenciais e logaritmos', cards: [
        ['Na fórmula M = C(1+i)^t, o que representa t?', 'A quantidade de períodos de capitalização, na unidade da taxa.'],
        ['Para que servem logaritmos em Matemática Financeira?', 'Para isolar o tempo quando a incógnita está no expoente.'],
        ['Qual o valor de log₁₀(100)?', '2, pois 10² = 100.'],
        ['Quais são as condições de existência de log_b(a), nos reais?', 'Argumento a > 0, base b > 0 e b ≠ 1.'],
        ['Se 2^t = 8, qual é o valor de t?', '3, pois 2³ = 8.'],
        ['Como isolar t em M = C(1+i)^t, com i > 0?', 't = ln(M/C) ÷ ln(1+i), considerando C > 0 e M > 0.'],
        ['O que é ln(x)?', 'O logaritmo natural, de base e (aproximadamente 2,71828).'],
        ['Posso usar log ou ln para calcular um prazo financeiro?', 'Sim. Na razão log(M/C) ÷ log(1+i), use a mesma base no numerador e denominador.']
      ]
    }
  ];

  const STORAGE_KEY = 'pdf-financeira-flashcards-v1';
  const byId = id => document.getElementById(id);
  const deck = DECK_GROUPS.flatMap(group => group.cards.map((pair, index) => ({
    id: group.id + '-' + String(index+1).padStart(2,'0'),
    topic: group.id, topicTitle: group.title, question:pair[0], answer:pair[1]
  })));
  const questionMap = new Map(deck.map(q => [q.id,q]));
  let order = deck.map(q => q.id);
  let currentIndex = 0;
  let flipped = false;
  let progress = {};

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      progress = Object.fromEntries(Object.entries(stored).filter(([id,status]) =>
        questionMap.has(id) && (status === 'known' || status === 'review')));
    }
  } catch (_) { progress = {}; }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch (_) { /* Continua funcionando quando armazenamento está bloqueado. */ }
  }

  function filteredCards() {
    const topic = byId('fc-topic').value;
    const status = byId('fc-status').value;
    return order.map(id => questionMap.get(id)).filter(q => q &&
      (topic === 'todos' || q.topic === topic) &&
      (status === 'todos' ||
        (status === 'new' && !progress[q.id]) ||
        progress[q.id] === status));
  }

  function announce(message) {
    byId('fc-announcement').textContent = message;
  }

  function setFlipped(value) {
    flipped = value;
    const button = byId('fc-card');
    button.classList.toggle('is-flipped',value);
    button.setAttribute('aria-pressed',String(value));
    button.setAttribute('aria-label', value ?
      'Resposta exibida. Toque para voltar à pergunta.' :
      'Pergunta exibida. Toque para revelar a resposta.');
    button.querySelector('.fc-card-front').setAttribute('aria-hidden',String(value));
    button.querySelector('.fc-card-back').setAttribute('aria-hidden',String(!value));
    byId('fc-mark-review').disabled = !value;
    byId('fc-mark-known').disabled = !value;
    byId('fc-hint').textContent = value ?
      'Marque como foi sua lembrança.' : 'Vire o cartão para registrar seu aprendizado.';
  }

  function render() {
    const statuses = deck.map(q=>progress[q.id]);
    const countKnown = statuses.filter(status=>status==='known').length;
    const countReview = statuses.filter(status=>status==='review').length;
    byId('fc-total').textContent = String(deck.length);
    byId('fc-known').textContent = String(countKnown);
    byId('fc-review').textContent = String(countReview);
    byId('fc-new').textContent = String(deck.length - countKnown - countReview);
    byId('fc-track-bar').style.width = (100*countKnown/deck.length).toFixed(2) + '%';

    const selected = filteredCards();
    const empty = selected.length === 0;
    byId('fc-study').hidden = empty;
    byId('fc-empty').hidden = !empty;
    byId('fc-card-tools').hidden = empty;
    if (empty) {
      byId('fc-empty-message').textContent =
        byId('fc-status').value === 'review' ?
          'Você ainda não marcou cartões para revisar nesse assunto.' :
        byId('fc-status').value === 'new' ?
          'Parabéns! Não há cartões novos nesse filtro.' :
          'Escolha outro assunto ou categoria para continuar estudando.';
      return;
    }
    currentIndex = Math.max(0,Math.min(currentIndex, selected.length - 1));
    const card = selected[currentIndex];
    byId('fc-position').textContent = 'Cartão ' + (currentIndex+1) + ' de ' + selected.length;
    byId('fc-current-topic').textContent = card.topicTitle;
    byId('fc-question').textContent = card.question;
    byId('fc-answer').textContent = card.answer;
    byId('fc-prev').disabled = selected.length <= 1;
    byId('fc-next').disabled = selected.length <= 1;
    setFlipped(false);
  }

  function step(delta) {
    const cards = filteredCards();
    if (!cards.length) return;
    currentIndex = (currentIndex + delta + cards.length) % cards.length;
    render();
    announce('Cartão ' + (currentIndex+1) + ' de ' + cards.length + '.');
  }

  function mark(status) {
    if (!flipped) return;
    const oldList = filteredCards();
    const current = oldList[currentIndex];
    if (!current) return;
    progress[current.id] = status;
    save();
    const newList = filteredCards();
    if (!newList.includes(current)) currentIndex = Math.min(currentIndex,newList.length-1);
    else currentIndex = (currentIndex+1)%newList.length;
    render();
    announce(status === 'known' ?
      'Cartão marcado como já aprendido. Próximo cartão.' :
      'Cartão marcado para revisão. Próximo cartão.');
  }

  function shuffle() {
    for (let i=order.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [order[i],order[j]]=[order[j],order[i]];
    }
    currentIndex=0;
    render();
    announce('Cartões embaralhados.');
  }

  function init() {
    const topicSelect=byId('fc-topic');
    DECK_GROUPS.forEach(group => {
      const option=document.createElement('option');
      option.value=group.id;
      option.textContent=group.title+' ('+group.cards.length+')';
      topicSelect.appendChild(option);
    });
    byId('fc-card').addEventListener('click',()=> {
      setFlipped(!flipped);
      announce(flipped ? 'Resposta revelada.' : 'Pergunta exibida.');
    });
    byId('fc-mark-review').addEventListener('click',()=>mark('review'));
    byId('fc-mark-known').addEventListener('click',()=>mark('known'));
    byId('fc-prev').addEventListener('click',()=>step(-1));
    byId('fc-next').addEventListener('click',()=>step(1));
    byId('fc-shuffle').addEventListener('click',shuffle);
    for(const id of ['fc-topic','fc-status']) {
      byId(id).addEventListener('change',()=>{currentIndex=0;render();});
    }
    byId('fc-reset-filters').addEventListener('click',()=>{
      topicSelect.value='todos';byId('fc-status').value='todos';currentIndex=0;render();
    });
    document.addEventListener('keydown',e=>{
      const tag=e.target.tagName;
      if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','SELECT','TEXTAREA'].includes(tag))return;
      if(e.key==='ArrowRight'){e.preventDefault();step(1);}
      if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}
    });
    render();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
}());
