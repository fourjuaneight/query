import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonSuccess } from '../common/helpers';
import { optionalQuery, requireQuery } from '../common/params';
import { getMTGCard } from './scryfall';

export const handleMTGCard = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const results = await getMTGCard({
    name: requireQuery(ctx, 'name'),
    set: optionalQuery(ctx, 'set'),
    number: optionalQuery(ctx, 'number'),
  });
  return jsonSuccess(ctx, results);
};
