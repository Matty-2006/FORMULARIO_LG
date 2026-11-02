import { getStore } from '@netlify/blobs';
import { handle } from '../lib/core.mjs';

export default async (req) => {
  const blobs = getStore({ name: 'cirelec', consistency: 'strong' });
  const store = {
    get: (k) => blobs.get(k, { type: 'json' }),
    set: (k, v) => blobs.setJSON(k, v),
    delete: (k) => blobs.delete(k),
  };
  return handle(req, store, Netlify.env.get('APP_KEY'));
};

export const config = { path: '/api/*' };
