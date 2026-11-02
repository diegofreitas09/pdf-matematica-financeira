import webPush from 'web-push';
import { getStore } from '@netlify/blobs';

const ORIGIN = 'https://pdf-matematica-financeir.netlify.app';
const CAMPAIGN = 'revisao-1med-20261102';
const EXPIRES = Date.parse('2026-11-10T03:00:00Z');

// Only publish this announcement once the matching review is live in production.
// Receipts are independent of subscription preferences, so syncing the planner
// cannot cause an old announcement to be sent again.
export async function announceReview(deps = {}) {
  const now = deps.now ?? Date.now();
  if (now >= EXPIRES) return { expired: true, sent: 0 };
  const env = deps.env ?? Netlify.env;
  const publicKey = env.get('VAPID_PUBLIC_KEY');
  const privateKey = env.get('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) return { configured: false, sent: 0 };
  const get = deps.fetch ?? fetch;
  const response = await get(ORIGIN + '/revisao-avaliacao.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Não foi possível confirmar a revisão publicada');
  const review = await response.json();
  if (!review.publicada || review.publicacaoId !== CAMPAIGN || review.questoes?.length !== 10) {
    return { published: false, sent: 0 };
  }
  const push = deps.push ?? webPush;
  push.setVapidDetails(ORIGIN, publicKey, privateKey);
  const storeFactory = deps.getStore ?? getStore;
  const subscriptions = storeFactory('pdf-financeira-vestibulares-push');
  const receipts = storeFactory({ name: 'pdf-financeira-review-deliveries', consistency: 'strong' });
  const message = JSON.stringify({
    title: 'Nova revisão de Matemática Financeira',
    body: '1ª série: 10 questões com novas situações-problema e gabarito comentado. Abra o campo Revisão para estudar.',
    url: '/revisao-avaliacao.html', tag: CAMPAIGN
  });
  let sent = 0, skipped = 0, failed = 0, stale = 0;
  // Stop safely before the scheduled runtime limit; a later execution resumes
  // from saved receipts without repeating completed deliveries.
  const deadline = Date.now() + 17000;
  for await (const page of subscriptions.list({ prefix: 'sub-', paginate: true })) {
    for (const entry of page.blobs) {
      if (Date.now() >= deadline) return { sent, skipped, failed, stale, pending: true };
      const receiptKey = CAMPAIGN + '/' + entry.key;
      if (await receipts.get(receiptKey)) { skipped++; continue; }
      const record = await subscriptions.get(entry.key, { type: 'json' });
      if (!record?.subscription) continue;
      try {
        await push.sendNotification(record.subscription, message, { TTL: 86400, urgency: 'normal', timeout: 4000 });
        await receipts.setJSON(receiptKey, { sentAt: new Date(now).toISOString() });
        sent++;
      } catch (error) {
        if ([404, 410].includes(Number(error?.statusCode))) {
          await subscriptions.delete(entry.key); stale++;
        } else { failed++; }
      }
    }
  }
  return { sent, skipped, failed, stale, pending: false };
}
