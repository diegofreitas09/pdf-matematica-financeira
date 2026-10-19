'use strict';

// IDs e tópicos correspondem ao banco de 110 questões do aplicativo original.
const LEGACY_STORAGE_KEY = 'pdf-logquest-v2';
const LEGACY_APP_URL = 'plataforma.html';
const worlds = [
  { id: 1, title: 'Portal dos Expoentes', topic: 'Conceitos', firstId: 1, count: 27 },
  { id: 2, title: 'Guardião do Domínio', topic: 'Domínio', firstId: 28, count: 14 },
  { id: 3, title: 'Laboratório Algébrico', topic: 'Propriedades', firstId: 42, count: 10 }
];

const $ = (selector, root = document) => root.querySelector(selector);
const userState = {
  xp: 0,
  streak: 0,
  level: 1,
  accuracy: 0,
  completedIds: new Set(),
  worldProgress: { 1: 0, 2: 0, 3: 0 }
};
let frameReady = false;
let pendingDestination = null;
let lastTrigger = null;

function getSavedState() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return { xp: 0, history: [] };
    const parsed = JSON.parse(raw);
    return {
      xp: Math.max(0, Number(parsed.xp) || 0),
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch (error) {
    console.warn('Progresso indisponível neste navegador:', error);
    return { xp: 0, history: [] };
  }
}

function computeStreak(history) {
  // Conta apenas dias em que houve tentativas; visitar a página não dá streak.
  const days = new Set();
  for (const item of history) {
    const date = new Date(item.time);
    if (!Number.isNaN(date.getTime())) {
      days.add(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
    }
  }
  const pointer = new Date();
  const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  if (!days.has(dayKey(pointer))) pointer.setDate(pointer.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(pointer))) {
    streak++;
    pointer.setDate(pointer.getDate() - 1);
  }
  return streak;
}

function syncUserState() {
  const saved = getSavedState();
  userState.xp = saved.xp;
  userState.level = Math.floor(saved.xp / 250) + 1;
  userState.streak = computeStreak(saved.history);
  userState.accuracy = saved.history.length
    ? Math.round(100 * saved.history.filter(item => item.ok === true).length / saved.history.length)
    : 0;

  // Questão só fica dominada após ao menos um acerto; não contamos repetições.
  userState.completedIds = new Set(
    saved.history
      .filter(item => item.ok === true && Number.isInteger(Number(item.id)))
      .map(item => Number(item.id))
      .filter(id => id >= 1 && id <= 110)
  );
  for (const world of worlds) {
    const finished = Array.from({ length: world.count }, (_, i) => world.firstId + i)
      .filter(id => userState.completedIds.has(id)).length;
    userState.worldProgress[world.id] = Math.round(100 * finished / world.count);
  }
  updateInterface();
}

function updateInterface() {
  $('#xp-value').textContent = userState.xp.toLocaleString('pt-BR');
  $('#streak-value').textContent = userState.streak.toLocaleString('pt-BR');
  $('#level-value').textContent = String(userState.level);
  $('#completed-value').replaceChildren(
    document.createTextNode(`${userState.completedIds.size} `),
    Object.assign(document.createElement('span'), { className: 'minor', textContent: '/ 110' })
  );
  $('#accuracy-value').textContent = `${userState.accuracy}%`;

  for (const [index, world] of worlds.entries()) {
    const progress = userState.worldProgress[world.id];
    const unlocked = index === 0 || userState.worldProgress[worlds[index - 1].id] === 100;
    const complete = progress === 100;
    const card = $(`[data-world="${world.id}"]`);
    const button = $(`[data-enter="${world.id}"]`);
    const status = $(`[data-status="${world.id}"]`);
    card.classList.toggle('is-locked', !unlocked);
    card.classList.toggle('is-complete', complete);
    button.disabled = !unlocked;
    button.setAttribute('aria-label', unlocked ? `Entrar no Mundo ${world.id}: ${world.title}` : `Mundo ${world.id} bloqueado; conclua o mundo anterior`);
    button.innerHTML = unlocked ? 'Entrar <span aria-hidden="true">→</span>' : 'Bloqueado <span aria-hidden="true">🔒</span>';
    status.textContent = complete ? '✓ Concluído' : unlocked ? 'Disponível' : '🔒 Bloqueado';
    $(`[data-progress-label="${world.id}"]`).textContent = `${progress}%`;
    $(`[data-progress-bar="${world.id}"]`).style.width = `${progress}%`;
    $(`[data-progress-track="${world.id}"]`).setAttribute('aria-valuenow', String(progress));
  }
}

function setStageMessage(text) {
  const status = $('#stage-status');
  status.textContent = text;
  status.hidden = false;
  $('#legacy-frame').hidden = true;
}

function showMissingAppMessage() {
  const status = $('#stage-status');
  status.replaceChildren();
  const message = document.createElement('p');
  message.textContent = 'Não encontrei o motor de questões. Copie o index.html original para plataforma.html, na mesma pasta destes arquivos.';
  const link = document.createElement('a');
  link.href = LEGACY_APP_URL;
  link.textContent = 'Verificar plataforma.html';
  status.append(message, link);
  status.hidden = false;
  $('#legacy-frame').hidden = true;
}

function applyAuroraSkin(doc) {
  if ($('#aurora-skin', doc)) return;
  const style = doc.createElement('style');
  style.id = 'aurora-skin';
  style.textContent = `
    :root { --bg:#0f0c29; --card:#211e43; --card2:#2d2857; --edge:#554f83;
      --text:#fff; --muted:#c7c2dc; --mint:#00f2fe; --gold:#ffd700; --pink:#ff6b6b; --blue:#00f2fe; }
    body { color:var(--text); background:linear-gradient(140deg,#0f0c29,#302b63 78%,#24243e); font-family:Inter,system-ui,sans-serif; }
    h1,h2,h3,.brand { font-family:'Space Grotesk',Inter,sans-serif; }
    .hero,.lessonPaper { background:linear-gradient(115deg,#24214e,#181735); border-color:#57508a; }
    .panel,.mission,.stat { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.15); }
    .primary { background:linear-gradient(110deg,#ffd700,#ffb766); color:#18132f; }
    .nav button.active,.stat strong,.money { color:#00f2fe; }
    .study-alert,.error-card { color:#fff; background:#29254e; border-color:#5a528a; }
    .study-alert p,.error-card p { color:#c7c2dc; }
    .feedback,.teach { background:#29254e; color:#fff; }
    .answer.correct { border-color:#00f2fe; background:#164a51; }
    a { color:inherit; } button:focus-visible,input:focus-visible,select:focus-visible { outline:3px solid #00f2fe; outline-offset:3px; }
  `;
  doc.head.appendChild(style);
  const fonts = doc.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap';
  doc.head.appendChild(fonts);
}

function launchDestination() {
  if (!frameReady || !pendingDestination) return;
  const frame = $('#legacy-frame');
  try {
    const app = frame.contentWindow;
    applyAuroraSkin(frame.contentDocument);
    if (pendingDestination.world && typeof app.startPractice === 'function') {
      app.startPractice(pendingDestination.world.topic);
    } else if (pendingDestination.route && typeof app.navigate === 'function') {
      app.navigate(pendingDestination.route);
    } else {
      showMissingAppMessage();
      return;
    }
    frame.hidden = false;
    $('#stage-status').hidden = true;
    syncUserState();
  } catch (error) {
    console.error('Erro ao iniciar atividade:', error);
    showMissingAppMessage();
  }
}

function openStage(destination, trigger) {
  if (destination.world) {
    const index = worlds.indexOf(destination.world);
    if (index > 0 && userState.worldProgress[worlds[index - 1].id] !== 100) return;
  }
  lastTrigger = trigger || document.activeElement;
  pendingDestination = destination;
  $('#stage-title').textContent = destination.world ? destination.world.title : destination.title;
  $('#game-stage').hidden = false;
  $('#page-root').inert = true;
  document.body.classList.add('dialog-open');
  $('#stage-close').focus();
  setStageMessage('Preparando sua missão...');
  console.info('[PDF Financeira] Abrindo:', destination.world?.topic || destination.route);

  if (frameReady) {
    launchDestination();
  } else {
    // Evita carregar os 110 itens e o aplicativo antigo durante o LCP.
    const frame = $('#legacy-frame');
    frame.loading = 'eager';
    if (!frame.getAttribute('src')) frame.src = LEGACY_APP_URL;
  }
}

function closeStage() {
  $('#game-stage').hidden = true;
  $('#page-root').inert = false;
  document.body.classList.remove('dialog-open');
  pendingDestination = null;
  syncUserState();
  if (lastTrigger?.isConnected && !lastTrigger.disabled) lastTrigger.focus();
  else $('a[href="#trilha"]').focus();
}

function init() {
  syncUserState();
  $('#stage-close').addEventListener('click', closeStage);
  $('#legacy-frame').addEventListener('load', () => {
    try {
      const app = $('#legacy-frame').contentWindow;
      frameReady = typeof app.startPractice === 'function' && typeof app.navigate === 'function';
    } catch (_) {
      frameReady = false;
    }
    if (frameReady) launchDestination();
    else showMissingAppMessage();
  });

  document.querySelectorAll('[data-enter]').forEach(button => {
    button.addEventListener('click', () => {
      const world = worlds.find(item => item.id === Number(button.dataset.enter));
      if (world) openStage({ world }, button);
    });
  });
  const names = {
    simulador: 'Laboratório financeiro', arena: 'Arena de simulados',
    caderno: 'Meu caderno de erros', biblioteca: 'Biblioteca de questões',
    professor: 'Meu desempenho', trilhas: 'Os 8 mundos'
  };
  document.querySelectorAll('[data-route]').forEach(button => {
    button.addEventListener('click', () => {
      const route = button.dataset.route;
      if (names[route]) openStage({ route, title: names[route] }, button);
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === LEGACY_STORAGE_KEY || event.key === null) syncUserState();
  });
  window.addEventListener('pageshow', syncUserState);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncUserState();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#game-stage').hidden) closeStage();
  });
}

// Atualizações offline; carregamento não bloqueia a primeira pintura.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => {
      console.warn('Modo offline indisponível:', error);
    });
  }, { once: true });
}
document.addEventListener('DOMContentLoaded', init, { once: true });