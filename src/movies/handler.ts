import type { Context } from 'hono';

import type { Bindings } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { queryMovie, queryMovieById, searchMovies } from './tmdb';

export const handleMovieQuery = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const title = ctx.req.query('title');
  if (!title) {
    return jsonError(ctx, 'Missing required query parameter: title');
  }

  const language = ctx.req.query('language');
  const year = ctx.req.query('year');

  try {
    const result = await queryMovie(ctx.env.TMDB_KEY, title, {
      ...(language && { language }),
      ...(year && { year: parseInt(year, 10) }),
    });
    if (!result) {
      return jsonError(ctx, `No movie found for title: ${title}`, 404);
    }
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleMovieById = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const id = ctx.req.param('id');
  const movieId = parseInt(id, 10);
  if (isNaN(movieId)) {
    return jsonError(ctx, 'Invalid movie ID');
  }

  const language = ctx.req.query('language');

  try {
    const result = await queryMovieById(ctx.env.TMDB_KEY, movieId, language);
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleMovieSearch = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const query = ctx.req.query('query');
  if (!query) {
    return jsonError(ctx, 'Missing required query parameter: query');
  }

  const language = ctx.req.query('language');
  const year = ctx.req.query('year');
  const page = ctx.req.query('page');

  try {
    const results = await searchMovies(ctx.env.TMDB_KEY, query, {
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
