import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { requireQuery } from '../common/params';
import { extractVideoId, queryVideo } from './youtube';

export const handleVideoQuery = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const url = requireQuery(ctx, 'url');

  const videoId = extractVideoId(url);
  if (!videoId) {
    return jsonError(ctx, `Invalid YouTube URL or video ID: ${url}`);
  }

  const result = await queryVideo(ctx.env.YOUTUBE_KEY, videoId);
  if (!result) {
    return jsonError(ctx, `No video found for URL: ${url}`, 404);
  }
  return jsonSuccess(ctx, result);
};
