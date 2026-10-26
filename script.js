'use strict';

// IDs e tópicos correspondem ao banco de 110 questões do aplicativo original.
const LEGACY_STORAGE_KEY = 'pdf-logquest-v2';
const LEGACY_APP_URL = 'plataforma.html';
const worlds = [
  { id: 1, title: 'Portal dos Expoentes', topic: 'Conceitos', firstId: 1, count: 27 },
  { id: 2, title: 'Guardião do Domínio', topic: 'Domínio', firstId: 28, count: 14 },
  { id: 3, title: 'Laboratório Algébrico', topic: 'Propriedades', firstId: 42, count: 10 }
];
const THEME_STORAGE_KEY = 'pdf-financeira-theme';

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


function getThemePreference() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || document.documentElement.getAttribute('data-theme') || 'dark';
  } catch (error) {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
}

function updateThemeToggle(theme) {
  const button = $('#theme-toggle');
  if (!button) return;
  const isLight = theme === 'light';
  button.setAttribute('aria-pressed', String(isLight));
  button.setAttribute('aria-label', isLight ? 'Alternar para modo noite' : 'Alternar para modo dia');
  $('.theme-toggle-icon', button).textContent = isLight ? '☀️' : '🌙';
  $('.theme-toggle-label', button).textContent = isLight ? 'Modo dia' : 'Modo noite';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (error) {}
  updateThemeToggle(theme);
  const frame = $('#legacy-frame');
  if (frame && frame.contentDocument) {
    applyAuroraSkin(frame.contentDocument, theme);
  }
}

function toggleTheme() {
  applyTheme(getThemePreference() === 'light' ? 'dark' : 'light');
}

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

function applyAuroraSkin(doc, theme = getThemePreference()) {
  const palette = theme === 'light'
    ? {
        bg: '#eef4ff', bg2: '#f8fbff', card: 'rgba(255,255,255,.86)', card2: '#ffffff', edge: 'rgba(24,46,88,.12)',
        text: '#1f2b3d', muted: '#53627a', mint: '#0c7ecf', gold: '#c99300', coral: '#db6262', blue: '#0c7ecf', accent: '#f3f7ff'
      }
    : {
        bg: '#0f0c29', bg2: '#24243e', card: 'rgba(255,255,255,.06)', card2: '#211e43', edge: 'rgba(255,255,255,.15)',
        text: '#ffffff', muted: '#c7c2dc', mint: '#00f2fe', gold: '#ffd700', coral: '#ff6b6b', blue: '#00f2fe', accent: '#29254e'
      };

  let style = $('#aurora-skin', doc);
  if (!style) {
    style = doc.createElement('style');
    style.id = 'aurora-skin';
    doc.head.appendChild(style);
    const fonts = doc.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap';
    doc.head.appendChild(fonts);
  }

  style.textContent = `
    :root { --bg:${palette.bg}; --card:${palette.card}; --card2:${palette.card2}; --edge:${palette.edge}; --text:${palette.text}; --muted:${palette.muted}; --mint:${palette.mint}; --gold:${palette.gold}; --pink:${palette.coral}; --blue:${palette.blue}; }
    html { color-scheme: ${theme}; }
    body { color:var(--text)!important; background:${theme === 'light' ? 'linear-gradient(180deg,#eef4ff,#f8fbff)' : 'linear-gradient(140deg,#0f0c29,#302b63 78%,#24243e)'}!important; font-family:Inter,system-ui,sans-serif!important; }
    h1,h2,h3,.brand,.money,.sectiontitle { color:var(--text)!important; font-family:'Space Grotesk',Inter,sans-serif!important; }
    p,small,label,li,span,td,th,div,strong,b { color: inherit; }
    .muted, .study-alert p, .error-card p, .feedback p, .teach p, footer, .source, .pill, .world-index { color:var(--muted)!important; }
    .chip,.pill,.study-alert,.error-card,.feedback,.teach,.panel,.mission,.stat,.lessonPaper,.bookBody,.hero,.sim-card,.card,table,.formula,.example,blockquote { background:${palette.card}!important; color:var(--text)!important; border-color:var(--edge)!important; }
    .hero,.lessonPaper,.bookBody { background:${theme === 'light' ? '#ffffff' : 'linear-gradient(115deg,#24214e,#181735)'}!important; }
    .top,.nav,.quick-panel,.stage-toolbar,.toolbar { background:${theme === 'light' ? 'rgba(255,255,255,.75)' : 'transparent'}!important; }
    .nav button,.secondary,.lessonTabs button,.answer,input,select,textarea { background:${theme === 'light' ? '#ffffff' : '#2d2857'}!important; color:var(--text)!important; border-color:var(--edge)!important; }
    .nav button.active,.lessonTabs button.active,.stat strong,.money,.pill.gold,.tag,.sectiontitle em { color:var(--mint)!important; }
    .primary { background:linear-gradient(110deg,${palette.gold},#ffb766)!important; color:${theme === 'light' ? '#162033' : '#18132f'}!important; border:0!important; }
    .answer.correct { border-color:var(--mint)!important; background:${theme === 'light' ? '#dff6ff' : '#164a51'}!important; }
    .answer.wrong { border-color:${palette.coral}!important; background:${theme === 'light' ? '#ffe7e7' : '#442637'}!important; }
    .bar, .progress-track { background:${theme === 'light' ? 'rgba(12,126,207,.12)' : 'rgba(255,255,255,.12)'}!important; }
    .bar span, .progress-track span { background:linear-gradient(90deg,${palette.mint},${palette.gold})!important; }
    table, .sim-table, .table, .bookTable { width:100%; border-collapse:collapse; overflow:hidden; border-radius:16px; }
    th, td { color:var(--text)!important; border-bottom:1px solid ${theme === 'light' ? 'rgba(24,46,88,.12)' : 'rgba(255,255,255,.12)'}!important; background:transparent!important; }
    th { background:${theme === 'light' ? '#f2f7ff' : 'rgba(255,255,255,.04)'}!important; }
    canvas { background: ${theme === 'light' ? '#ffffff' : 'transparent'}; border-radius:16px; }
    svg text, .chart text { fill: ${palette.text}!important; color: ${palette.text}!important; }
    a { color:${palette.mint}!important; }
    button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible { outline:3px solid ${palette.mint}!important; outline-offset:3px!important; }
    .question { color:var(--text)!important; }
    .log { color:var(--muted)!important; border-color:var(--edge)!important; }
  `;

  doc.documentElement.setAttribute('data-theme', theme);
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
    if (pendingDestination.questionCode) {
      // Reaproveita a consulta oficial da biblioteca e abre o gabarito comentado.
      const lookupInput = frame.contentDocument.getElementById('question-search');
      const lookupButton = frame.contentDocument.getElementById('lookup');
      if (!lookupInput || !lookupButton) {
        showMissingAppMessage();
        return;
      }
      lookupInput.value = pendingDestination.questionCode;
      lookupButton.click();
      lookupInput.scrollIntoView({ block: 'start', behavior: 'auto' });
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
  applyTheme(getThemePreference());
  syncUserState();
  $('#theme-toggle')?.addEventListener('click', toggleTheme);
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

document.addEventListener('DOMContentLoaded', init, { once: true });
if ('serviceWorker' in navigator && location.protocol==='https:') window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn),{once:true});
