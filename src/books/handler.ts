import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { intQuery, optionalQuery, requireQuery } from '../common/params';
import { queryBookByISBN, searchBooksByTitle } from './openlibrary';

export const handleBookByISBN = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const isbn = requireQuery(ctx, 'isbn');

  const result = await queryBookByISBN(isbn);
  if (!result) {
    return jsonError(ctx, `No book found for ISBN: ${isbn}`, 404);
  }
  return jsonSuccess(ctx, result);
};

export const handleBookSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');

  const results = await searchBooksByTitle(title, {
    limit: intQuery(ctx, 'limit', { max: 100 }),
    page: intQuery(ctx, 'page'),
    language: optionalQuery(ctx, 'language'),
  });
  return jsonSuccess(ctx, results);
};
