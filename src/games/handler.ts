import type { Context } from 'hono';

import type { Bindings } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { searchGames, queryGame, queryGameById } from './igdb';

export const handleGameSearch = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const query = ctx.req.query('query');
  if (!query) {
    return jsonError(ctx, 'Missing required query parameter: query');
  }

  const limit = ctx.req.query('limit');

  try {
    const results = await searchGames(ctx.env, query, {
      ...(limit && { limit: parseInt(limit, 10) }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleGameQuery = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const title = ctx.req.query('title');
  if (!title) {
    return jsonError(ctx, 'Missing required query parameter: title');
  }

  try {
    const result = await queryGame(ctx.env, title);
    if (!result) {
      return jsonError(ctx, `No game found for title: ${title}`, 404);
    }
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleGameById = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const id = ctx.req.param('id');
  const gameId = parseInt(id, 10);
  if (isNaN(gameId)) {
    return jsonError(ctx, 'Invalid game ID');
  }

  try {
    const result = await queryGameById(ctx.env, gameId);
    if (!result) {
      return jsonError(ctx, `No game found for ID: ${gameId}`, 404);
    }
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
