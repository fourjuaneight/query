import type { Context } from 'hono';

import type { Bindings } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { queryVideo } from './youtube';

export const handleVideoQuery = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const url = ctx.req.query('url');
  if (!url) {
    return jsonError(ctx, 'Missing required query parameter: url');
  }

  try {
    const result = await queryVideo(ctx.env.YOUTUBE_KEY, url);
    if (!result) {
      return jsonError(ctx, `No video found for URL: ${url}`, 404);
    }
    return jsonSuccess(ctx, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
