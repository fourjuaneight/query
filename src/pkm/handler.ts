import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonSuccess } from '../common/helpers';
import { intQuery, optionalQuery, requireQuery } from '../common/params';
import { MAX_LIMIT, getPKMCard } from './tcgdex';

export const handlePKMCard = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const results = await getPKMCard({
    name: requireQuery(ctx, 'name'),
    set: optionalQuery(ctx, 'set'),
    limit: intQuery(ctx, 'limit', { max: MAX_LIMIT }),
    page: intQuery(ctx, 'page'),
  });
  return jsonSuccess(ctx, results);
};
