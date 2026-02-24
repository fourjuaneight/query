import type { Context } from 'hono';

import type { Bindings } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { getPKMCard } from './tcgdex';

export const handlePKMCard = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const name = ctx.req.query('name');
  if (!name) {
    return jsonError(ctx, 'Missing required query parameter: name');
  }

  const set = ctx.req.query('set');

  try {
    const results = await getPKMCard({
      name,
      ...(set && { set }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
