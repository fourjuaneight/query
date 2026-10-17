import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import {
  boolQuery,
  idParam,
  intQuery,
  optionalQuery,
  requireQuery,
} from '../common/params';
import { queryMovie, queryMovieById, searchMovies } from './tmdb';

const YEAR_RANGE = { min: 1800, max: 2200 };

export const handleMovieQuery = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');

  const result = await queryMovie(ctx.env.TMDB_KEY, title, {
    language: optionalQuery(ctx, 'language'),
    year: intQuery(ctx, 'year', YEAR_RANGE),
  });
  if (!result) {
    return jsonError(ctx, `No movie found for title: ${title}`, 404);
  }
  return jsonSuccess(ctx, result);
};

export const handleMovieById = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const movieId = idParam(ctx, 'movie');

  const result = await queryMovieById(
    ctx.env.TMDB_KEY,
    movieId,
    optionalQuery(ctx, 'language'),
  );
  return jsonSuccess(ctx, result);
};

export const handleMovieSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const query = requireQuery(ctx, 'query');

  const results = await searchMovies(ctx.env.TMDB_KEY, query, {
    language: optionalQuery(ctx, 'language'),
    year: intQuery(ctx, 'year', YEAR_RANGE),
    page: intQuery(ctx, 'page', { max: 500 }),
    details: boolQuery(ctx, 'details'),
  });
  return jsonSuccess(ctx, results);
};
