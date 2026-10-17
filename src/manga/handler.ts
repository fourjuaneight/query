import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { intQuery, requireQuery } from '../common/params';
import { getMangaDetails, searchManga } from './mangadex';

export const handleMangaDetails = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const id = ctx.req.param('id');
  if (!id) {
    return jsonError(ctx, 'Missing required parameter: id');
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
