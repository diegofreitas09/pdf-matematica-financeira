'use strict';
(() => {
  const input = document.getElementById('expr');
  const preview = document.getElementById('calculator-preview');
  const list = document.getElementById('calculator-history');
  if (!input || !preview || !list) return;
  const KEY = 'pdf-financeira-calculator-history-v1';
  let records = [], memory = 0, lastResult = null;
  try { const saved = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(saved)) records = saved.filter(x => typeof x.expr === 'string' && Number.isFinite(x.value)).slice(0,25); } catch (_) {}
  const fmt = value => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:10}).format(value);
  const evaluate = () => evalSafe(input.value,document.getElementById('angle').value);
  function showPreview() {
    try { const n = evaluate(); preview.textContent = 'Prévia: ' + fmt(n); }
    catch (_) { preview.textContent = 'Digite uma expressão válida'; }
  }
  function insert(str) {
    input.setRangeText(str,input.selectionStart,input.selectionEnd,'end');
    input.focus();
    showPreview();
  }
  function render() {
    list.replaceChildren();
    for(const item of records) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.expr + ' = ' + fmt(item.value);
      button.title = 'Reutilizar expressão';
      button.onclick = () => { input.value = item.expr; input.focus(); showPreview(); };
      list.append(button);
    }
    document.getElementById('calculator-memory-indicator').textContent = 'Memória: ' + fmt(memory);
  }
  // Registra o cálculo sem alterar a função científica já existente.
  document.getElementById('f-sci').addEventListener('submit', () => {
    try {
      lastResult = evaluate();
      records.unshift({expr:input.value,value:lastResult});
      records = records.slice(0,25);
      try { localStorage.setItem(KEY,JSON.stringify(records)); } catch (_) {}
      render();
      preview.textContent = 'Resultado: ' + fmt(lastResult);
    } catch (_) {}
  });
  document.getElementById('calculator-tools').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.append) return insert(button.dataset.append);
    if (button.dataset.delete) {
      const a = input.selectionStart, b = input.selectionEnd;
      if (a !== b) input.setRangeText('',a,b,'end');
      else if (a > 0) input.setRangeText('',a-1,a,'end');
      input.focus();showPreview();return;
    }
    if (button.dataset.memory) {
      const action = button.dataset.memory;
      if (action === 'MC') memory = 0;
      else if (action === 'MR') insert(String(memory));
      else {
        let value = 0;
        try { value = evaluate(); } catch (_) { preview.textContent = 'Expressão inválida para memória'; return; }
        memory += action === 'M+' ? value : -value;
      }
      render();
    }
  });
  document.getElementById('calculator-clear-history').onclick = () => {
    records = []; try { localStorage.removeItem(KEY); } catch (_) {}
    render();
  };
  document.getElementById('calculator-copy').onclick = async () => {
    if (lastResult === null) {preview.textContent='Calcule primeiro para copiar.';return;}
    try {await navigator.clipboard.writeText(String(lastResult));preview.textContent='Resultado copiado.';}
    catch (_) {preview.textContent='Não foi possível copiar neste navegador.';}
  };
  input.addEventListener('input',showPreview);
  document.getElementById('angle').addEventListener('change',showPreview);
  render();showPreview();
})();
