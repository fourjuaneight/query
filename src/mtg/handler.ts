import type { Context } from 'hono';

import { jsonError, jsonSuccess } from '../common/helpers';
import { getMTGCard } from './scryfall';

export const handleMTGCard = async (ctx: Context): Promise<Response> => {
  const name = ctx.req.query('name');
  if (!name) {
    return jsonError(ctx, 'Missing required query parameter: name');
  }

  const set = ctx.req.query('set');
  const number = ctx.req.query('number');

  try {
    const results = await getMTGCard({
      name,
      ...(set && { set }),
      ...(number && { number }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
