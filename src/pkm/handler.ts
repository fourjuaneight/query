import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonSuccess } from '../common/helpers';
import { optionalQuery, requireQuery } from '../common/params';
import { getPKMCard } from './tcgdex';

export const handlePKMCard = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const results = await getPKMCard({
    name: requireQuery(ctx, 'name'),
    set: optionalQuery(ctx, 'set'),
  });
  return jsonSuccess(ctx, results);
};
