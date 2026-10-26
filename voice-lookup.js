/* Busca por voz e código; sem gravação persistente de áudio. */
(function () {
  'use strict';
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const valueOf = document.getElementById.bind(document);
  let recognition = null;
  let listening = false;
  let received = false;

  function clean(text) {
    return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Reconhece números ditados em português, como "vinte e sete" ou "cento e dez".
  function spokenNumber(tokens) {
    const values = {
      zero:0, um:1, uma:1, dois:2, duas:2, tres:3, quatro:4, cinco:5,
      seis:6, sete:7, oito:8, nove:9, dez:10, onze:11, doze:12,
      treze:13, quatorze:14, catorze:14, quinze:15, dezesseis:16,
      dezasseis:16, dezessete:17, dezassete:17, dezoito:18,
      dezenove:19, dezanove:19, vinte:20, trinta:30, quarenta:40,
      cinquenta:50, sessenta:60, setenta:70, oitenta:80, noventa:90,
      cem:100, cento:100
    };
    let total = 0;
    let sawNumber = false;
    for (const token of tokens) {
      if (token === 'e') continue;
      if (!Object.prototype.hasOwnProperty.call(values, token)) return null;
      total += values[token];
      sawNumber = true;
    }
    return sawNumber ? total : null;
  }

  function parseCode(source) {
    let text = clean(source);
    if (!text) return null;
    text = text.replace(/\b(p d f|pdf|m f|mf|questao|questoes|codigo|numero|n|da|de|do|a|o|qual|quero|buscar|consultar|procure|encontre|por|favor|traco|hifen)\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    let number = null;
    if (/^\d+$/.test(text)) number = Number(text);
    else if (/^(?:\d+\s+)+\d+$/.test(text)) {
      const groups = text.split(' ');
      number = (groups.every(group => group.length === 1) && groups.length <= 4) || groups.slice(0,-1).every(group => /^0+$/.test(group))
        ? Number(groups.join('')) : null;
    } else {
      number = spokenNumber(text.split(' '));
    }
    return Number.isInteger(number) && number >= 1 && number <= 110 ? number : null;
  }

  function say(message, kind) {
    const status = valueOf('pdf-voice-status');
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind || 'info';
  }

  function setListening(value) {
    listening = value;
    valueOf('pdf-voice-entry')?.classList.toggle('is-listening', value);
    const button = valueOf('pdf-voice-trigger');
    if (button) {
      button.setAttribute('aria-pressed', String(value));
      button.setAttribute('aria-label', value ? 'Parar de ouvir o código da questão' : 'Dizer código da questão pelo microfone');
    }
  }

  function goToQuestion(raw, trigger) {
    const id = parseCode(raw);
    if (!id) {
      say('Não reconheci um código válido. Digite ou diga um número de 1 a 110.', 'error');
      valueOf('pdf-voice-code')?.focus();
      return;
    }
    const code = 'PDF-MF-' + String(id).padStart(4, '0');
    valueOf('pdf-voice-code').value = code;
    say('Código ' + code + ' identificado. Abrindo questão e comentário…');
    if (typeof window.openStage === 'function') {
      window.openStage({ route:'biblioteca', title:'Consulta ' + code, questionCode:code }, trigger);
    } else {
      say('A consulta não foi carregada. Atualize a página e tente novamente.', 'error');
    }
  }

  function beginListening() {
    if (listening) {
      recognition?.stop();
      return;
    }
    if (!Recognition) {
      say('O comando de voz não é compatível com este navegador. Digite o código no campo.', 'error');
      valueOf('pdf-voice-code')?.focus();
      return;
    }
    try {
      recognition = new Recognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      received = false;
      recognition.onstart = function () {
        setListening(true);
        say('Estou ouvindo! Diga, por exemplo: questão vinte e sete.');
      };
      recognition.onresult = function (event) {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        received = true;
        setListening(false);
        goToQuestion(transcript, valueOf('pdf-voice-trigger'));
      };
      recognition.onerror = function (event) {
        received = true;
        const denied = event.error === 'not-allowed' || event.error === 'service-not-allowed';
        const noAudio = event.error === 'no-speech';
        say(denied ? 'Microfone não autorizado. Permita o acesso ou digite o código.' :
          noAudio ? 'Não ouvi um código. Toque no microfone para tentar novamente.' :
          'Não foi possível reconhecer a fala. Use a digitação, se preferir.', 'error');
        setListening(false);
      };
      recognition.onend = function () {
        setListening(false);
        if (!received) say('Escuta encerrada. Você pode tentar novamente ou digitar o código.');
      };
      recognition.start();
    } catch (error) {
      setListening(false);
      say('Não foi possível iniciar o microfone. Digite o código da questão.', 'error');
    }
  }

  function initVoice() {
    const form = valueOf('pdf-voice-form');
    const mic = valueOf('pdf-voice-trigger');
    if (!form || !mic) return;
    mic.addEventListener('click', beginListening);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (listening) recognition?.stop();
      goToQuestion(valueOf('pdf-voice-code').value, form.querySelector('button[type=submit]'));
    });
    say('Diga o código pelo microfone ou digite. Exemplo: PDF-MF-0027.');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVoice, { once:true });
  } else {
    initVoice();
  }
}());
