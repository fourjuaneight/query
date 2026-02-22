import type { Context } from 'hono';

import { jsonError, jsonSuccess } from '../common/helpers';
import { searchRepos, queryRepo } from './github';

export const handleRepoSearch = async (ctx: Context): Promise<Response> => {
  const query = ctx.req.query('query');
  if (!query) {
    return jsonError(ctx, 'Missing required query parameter: query');
  }

  const language = ctx.req.query('language');
  const sort = ctx.req.query('sort') as
    | 'stars'
    | 'forks'
    | 'help-wanted-issues'
    | 'updated'
    | undefined;
  const order = ctx.req.query('order') as 'asc' | 'desc' | undefined;
  const page = ctx.req.query('page');
  const perPage = ctx.req.query('per_page');

  try {
    const results = await searchRepos(query, {
      ...(language && { language }),
      ...(sort && { sort }),
      ...(order && { order }),
      ...(page && { page: parseInt(page, 10) }),
      ...(perPage && { perPage: parseInt(perPage, 10) }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleRepoQuery = async (ctx: Context): Promise<Response> => {
  const name = ctx.req.query('name');
  if (!name) {
    return jsonError(ctx, 'Missing required query parameter: name');
  }

  try {
    const result = await queryRepo(name);
    if (!result) {
      return jsonError(ctx, `No repo found for name: ${name}`, 404);
    }
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
