import { announceReview } from '../../server/review-announcement.mjs';

// Netlify verifies deploy events. There is no public broadcast endpoint.
export default {
  async deploySucceeded() {
    console.log('Aviso da revisão publicada:', await announceReview());
  }
};
