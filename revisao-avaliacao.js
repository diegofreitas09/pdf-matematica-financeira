/* PDF Financeira — revisão da avaliação, publicação e estudo com gabarito comentado. */
(function () {
  'use strict';
  const entry = document.getElementById('pdf-review-entry');
  const page = document.getElementById('pdf-review-page');
  if (!entry && !page) return;

  const byId = (id) => document.getElementById(id);
  const validQuestion = (q) => q && typeof q.enunciado === 'string' && q.enunciado.trim().length > 0;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  async function fetchRevision() {
    const response = await fetch('./revisao-avaliacao.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Não foi possível consultar a revisão');
    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Conteúdo inválido');
    const questions = Array.isArray(data.questoes) ? data.questoes.filter(validQuestion) : [];
    return { data, questions, available: data.publicada === true && questions.length > 0 };
  }

  function showEntry(payload) {
    const { data, questions, available } = payload;
    entry.dataset.state = available ? 'published' : 'draft';
    const tag = byId('pdf-review-entry-tag');
    const description = byId('pdf-review-entry-description');
    if (tag) tag.textContent = available ? '✦ REVISÃO DISPONÍVEL AGORA' : '✎ ESPAÇO DE REVISÃO';
    if (description) description.textContent = available
      ? questions.length + ' questão(ões) para estudar. Toque e comece a revisão!'
      : 'Estamos preparando as questões da próxima avaliação.';
    const link = entry.querySelector('a');
    if (link) link.setAttribute('aria-label', available
      ? 'Abrir revisão da avaliação, ' + questions.length + ' questões disponíveis'
      : 'Abrir o espaço da revisão da avaliação, em preparação');
  }

  function node(tag, className, textValue) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textValue !== undefined) el.textContent = String(textValue);
    return el;
  }
  function readProgress(key) {
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      return new Set(Array.isArray(list) ? list.filter(x => typeof x === 'string') : []);
    } catch (_) { return new Set(); }
  }
  function optionsOf(question) {
    if (Array.isArray(question.alternativas)) {
      return question.alternativas.map((text, idx) => [letters[idx] || String(idx + 1), String(text)]);
    }
    if (question.alternativas && typeof question.alternativas === 'object') {
      return Object.entries(question.alternativas).map(([key, text]) => [String(key).trim().toUpperCase(), String(text)]);
    }
    return [];
  }

  function renderPage(payload) {
    const { data, questions, available } = payload;
    const heading = byId('pdf-review-page-title');
    const description = byId('pdf-review-page-description');
    const badge = byId('pdf-review-page-status');
    const empty = byId('pdf-review-empty');
    const workspace = byId('pdf-review-workspace');
    if (heading && typeof data.titulo === 'string' && data.titulo.trim()) heading.textContent = data.titulo;
    if (description && typeof data.descricao === 'string') description.textContent = data.descricao;
    badge.textContent = available ? '✓ Conteúdo publicado' : 'Em preparação';
    empty.hidden = available;
    workspace.hidden = !available;
    if (!available) return;

    const list = byId('pdf-review-list');
    const total = questions.length;
    byId('pdf-review-total').textContent = total + (total === 1 ? ' questão' : ' questões');
    const key = 'pdf-revisao-avaliacao-estudo-v1:' + String(data.atualizadaEm || 'sem-data');
    const allIds = questions.map((q, idx) => String(q.id || 'questao-' + (idx + 1)));
    const reviewed = readProgress(key);
    const updateProgress = () => {
      const completed = allIds.filter(id => reviewed.has(id)).length;
      byId('pdf-review-reviewed').textContent = completed + ' de ' + total + ' revisada(s)';
      byId('pdf-review-meter-fill').style.width = (total ? completed / total * 100 : 0) + '%';
    };
    const markReviewed = (id) => {
      reviewed.add(id);
      try { localStorage.setItem(key, JSON.stringify([...reviewed])); } catch (_) {}
      updateProgress();
    };
    list.replaceChildren();

    questions.forEach((q, idx) => {
      const id = String(q.id || 'questao-' + (idx + 1));
      const card = node('article', 'pdf-review-question');
      const top = node('div', 'pdf-review-question-header');
      top.append(node('span', 'pdf-review-number', 'QUESTÃO ' + String(idx + 1).padStart(2, '0') + ' · ' + id));
      if (q.assunto) top.append(node('span', 'pdf-review-topic', q.assunto));
      card.append(top, node('h2', '', q.enunciado));

      const options = optionsOf(q);
      const answer = q.resposta == null ? '' : String(q.resposta).trim();
      const feedback = node('div', 'pdf-review-feedback');
      feedback.setAttribute('role', 'status');
      const solution = node('div', 'pdf-review-solution');
      solution.hidden = true;
      const solutionHeading = node('strong', '', options.length ? 'Gabarito: ' + (answer || 'Aguardando publicação') : 'Resposta esperada');
      solution.append(solutionHeading);
      if (!options.length) solution.append(node('p', '', answer || 'O gabarito será publicado em breve.'));
      if (q.comentario || q.resolucao) solution.append(node('p', '', String(q.comentario || q.resolucao)));
      const reveal = () => { solution.hidden = false; if (answer) markReviewed(id); };

      if (options.length) {
        const field = node('div', 'pdf-review-options');
        field.setAttribute('role', 'radiogroup');
        field.setAttribute('aria-label', 'Alternativas da questão ' + (idx + 1));
        options.forEach(([letter, text]) => {
          const label = node('label', 'pdf-review-choice');
          const input = node('input');
          input.type = 'radio';
          input.name = 'pdf-review-choice-' + idx;
          input.value = letter;
          label.append(input, node('span', 'pdf-review-choice-letter', letter + ')'), node('span', '', text));
          field.append(label);
        });
        const check = node('button', 'pdf-review-action', 'Conferir minha resposta');
        check.type = 'button';
        check.addEventListener('click', () => {
          const chosen = field.querySelector('input:checked');
          if (!chosen) { feedback.textContent = 'Selecione uma alternativa para conferir.'; return; }
          if (!answer) { feedback.textContent = 'O gabarito ainda não foi cadastrado.'; return; }
          const correct = chosen.value.toUpperCase() === answer.toUpperCase();
          feedback.textContent = correct ? '✓ Parabéns! Resposta correta.' : 'Continue treinando! Confira o comentário e tente entender o raciocínio.';
          reveal();
        });
        card.append(field, check, feedback, solution);
      } else {
        const check = node('button', 'pdf-review-action', 'Ver resposta comentada');
        check.type = 'button';
        check.addEventListener('click', () => { reveal(); check.textContent = 'Resposta exibida'; });
        card.append(check, solution);
      }
      list.append(card);
    });
    updateProgress();
  }

  async function load() {
    try {
      const payload = await fetchRevision();
      if (entry) showEntry(payload);
      if (page) renderPage(payload);
    } catch (_) {
      if (entry) {
        entry.dataset.state = 'draft';
        const label = byId('pdf-review-entry-description');
        if (label) label.textContent = 'Toque para consultar a revisão da avaliação.';
      }
      if (page) {
        byId('pdf-review-page-status').textContent = 'Não foi possível atualizar';
        const paragraph = byId('pdf-review-empty-message');
        if (paragraph) paragraph.textContent = 'Confira sua conexão e abra esta página novamente para verificar as questões.';
      }
    }
  }
  load();
  if (entry) window.addEventListener('pageshow', load);
  if (entry) document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
}());
