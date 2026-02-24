import type { Context } from 'hono';

import type { Bindings } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { queryBookByISBN, searchBooksByTitle } from './openlibrary';

export const handleBookByISBN = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const isbn = ctx.req.query('isbn');
  if (!isbn) {
    return jsonError(ctx, 'Missing required query parameter: isbn');
  }

  try {
    const result = await queryBookByISBN(isbn);
    if (!result) {
      return jsonError(ctx, `No book found for ISBN: ${isbn}`, 404);
    }
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleBookSearch = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const title = ctx.req.query('title');
  if (!title) {
    return jsonError(ctx, 'Missing required query parameter: title');
  }

  const limit = ctx.req.query('limit');
  const page = ctx.req.query('page');
  const language = ctx.req.query('language');

  try {
    const results = await searchBooksByTitle(title, {
      ...(limit && { limit: parseInt(limit, 10) }),
      ...(page && { page: parseInt(page, 10) }),
      ...(language && { language }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
