import type { Context } from 'hono';

import { jsonError, jsonSuccess } from '../common/helpers';
import { queryTVShow, queryTVShowById, searchTVShows } from './tmdb';

export const handleTVShowQuery = async (ctx: Context): Promise<Response> => {
  const title = ctx.req.query('title');
  if (!title) {
    return jsonError(ctx, 'Missing required query parameter: title');
  }

  const language = ctx.req.query('language');
  const year = ctx.req.query('year');

  try {
    const result = await queryTVShow(title, {
      ...(language && { language }),
      ...(year && { year: parseInt(year, 10) }),
    });
    if (!result) {
      return jsonError(ctx, `No TV show found for title: ${title}`, 404);
    }
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleTVShowById = async (ctx: Context): Promise<Response> => {
  const id = ctx.req.param('id');
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) {
    return jsonError(ctx, 'Invalid series ID');
  }

  const language = ctx.req.query('language');

  try {
    const result = await queryTVShowById(seriesId, language);
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleTVShowSearch = async (ctx: Context): Promise<Response> => {
  const query = ctx.req.query('query');
  if (!query) {
    return jsonError(ctx, 'Missing required query parameter: query');
  }

  const language = ctx.req.query('language');
  const year = ctx.req.query('year');
  const page = ctx.req.query('page');

  try {
    const results = await searchTVShows(query, {
      ...(language && { language }),
      ...(year && { year: parseInt(year, 10) }),
      ...(page && { page: parseInt(page, 10) }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
