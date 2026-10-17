import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import {
  idParam,
  intQuery,
  optionalQuery,
  requireQuery,
} from '../common/params';
import { queryTVShow, queryTVShowById, searchTVShows } from './tmdb';

const YEAR_RANGE = { min: 1800, max: 2200 };

export const handleTVShowQuery = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');

  const result = await queryTVShow(ctx.env.TMDB_KEY, title, {
    language: optionalQuery(ctx, 'language'),
    year: intQuery(ctx, 'year', YEAR_RANGE),
  });
  if (!result) {
    return jsonError(ctx, `No TV show found for title: ${title}`, 404);
  }
  return jsonSuccess(ctx, result);
};

export const handleTVShowById = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const seriesId = idParam(ctx, 'series');

  const result = await queryTVShowById(
    ctx.env.TMDB_KEY,
    seriesId,
    optionalQuery(ctx, 'language'),
  );
  return jsonSuccess(ctx, result);
};

export const handleTVShowSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const query = requireQuery(ctx, 'query');

  const results = await searchTVShows(ctx.env.TMDB_KEY, query, {
    language: optionalQuery(ctx, 'language'),
    year: intQuery(ctx, 'year', YEAR_RANGE),
    page: intQuery(ctx, 'page', { max: 500 }),
  });
  return jsonSuccess(ctx, results);
};
