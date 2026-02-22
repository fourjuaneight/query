import type { Context } from 'hono';

import { jsonError, jsonSuccess } from '../common/helpers';
import { getMangaDetails, searchManga } from './mangadex';

export const handleMangaDetails = async (ctx: Context): Promise<Response> => {
  const id = ctx.req.param('id');
  if (!id) {
    return jsonError(ctx, 'Missing required parameter: id');
  }

  try {
    const result = await getMangaDetails(id);
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleMangaSearch = async (ctx: Context): Promise<Response> => {
  const title = ctx.req.query('title');
  if (!title) {
    return jsonError(ctx, 'Missing required query parameter: title');
  }

  const limit = ctx.req.query('limit');
  const offset = ctx.req.query('offset');

  try {
    const results = await searchManga(title, {
      ...(limit && { limit: parseInt(limit, 10) }),
      ...(offset && { offset: parseInt(offset, 10) }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
