import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { intQuery, requireQuery } from '../common/params';
import { getMangaDetails, searchManga } from './mangadex';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const handleMangaDetails = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const id = ctx.req.param('id') ?? '';
  if (!UUID.test(id)) {
    return jsonError(ctx, 'Invalid manga ID');
  }

  const result = await getMangaDetails(id);
  return jsonSuccess(ctx, result);
};

export const handleMangaSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');

  const results = await searchManga(title, {
    limit: intQuery(ctx, 'limit', { max: 100 }),
    offset: intQuery(ctx, 'offset', { min: 0, max: 10000 }),
  });
  return jsonSuccess(ctx, results);
};
