import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import {
  enumQuery,
  intQuery,
  optionalQuery,
  requireQuery,
} from '../common/params';
import { searchRepos, queryRepo } from './github';

const SORTS = [
  'best-match',
  'stars',
  'forks',
  'help-wanted-issues',
  'updated',
] as const;
const ORDERS = ['asc', 'desc'] as const;

export const handleRepoSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const query = requireQuery(ctx, 'query');

  const results = await searchRepos(ctx.env.GH_TOKEN, query, {
    language: optionalQuery(ctx, 'language'),
    sort: enumQuery(ctx, 'sort', SORTS),
    order: enumQuery(ctx, 'order', ORDERS),
    page: intQuery(ctx, 'page'),
    perPage: intQuery(ctx, 'per_page', { max: 100 }),
  });
  return jsonSuccess(ctx, results);
};

export const handleRepoQuery = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const name = requireQuery(ctx, 'name');

  const result = await queryRepo(ctx.env.GH_TOKEN, name);
  if (!result) {
    return jsonError(ctx, `No repo found for name: ${name}`, 404);
  }
  return jsonSuccess(ctx, result);
};
