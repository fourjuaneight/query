import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { idParam, intQuery, requireQuery } from '../common/params';
import { searchGames, queryGame, queryGameById } from './igdb';

export const handleGameSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const query = requireQuery(ctx, 'query');

  const results = await searchGames(ctx.env, query, {
    limit: intQuery(ctx, 'limit', { max: 500 }),
  });
  return jsonSuccess(ctx, results);
};

export const handleGameQuery = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');

  const result = await queryGame(ctx.env, title);
  if (!result) {
    return jsonError(ctx, `No game found for title: ${title}`, 404);
  }
  return jsonSuccess(ctx, result);
};

export const handleGameById = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const gameId = idParam(ctx, 'game');

  const result = await queryGameById(ctx.env, gameId);
  if (!result) {
    return jsonError(ctx, `No game found for ID: ${gameId}`, 404);
  }
  return jsonSuccess(ctx, result);
};
