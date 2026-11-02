/* Seleção equilibrada por assunto, sem duplicar IDs no treino. */
(function (root) {
  'use strict';
  function shuffle(items, random = Math.random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function select(bank, count, previous = [], random = Math.random) {
    const unique = [...new Map(bank.map(q => [q.id, q])).values()];
    const avoid = new Set(previous);
    const groups = new Map();
    for (const q of unique) {
      const key = q.grupo || q.assunto;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(q);
    }
    const queues = shuffle([...groups.values()], random).map(group => [
      ...shuffle(group.filter(q => !avoid.has(q.id)), random),
      ...shuffle(group.filter(q => avoid.has(q.id)), random)
    ]);
    const chosen = [];
    const limit = Math.min(unique.length, Math.max(0, Math.floor(count)));
    while (chosen.length < limit) {
      for (const queue of queues) {
        if (queue.length && chosen.length < limit) chosen.push(queue.shift());
      }
    }
    return shuffle(chosen, random);
  }
  const api = { select };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PDFReviewTraining = api;
}(typeof window === 'undefined' ? globalThis : window));
