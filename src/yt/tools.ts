import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import type { Bindings } from '../common/typings';
import { READ_ONLY, runTool, text } from '../mcp/helpers';
import { extractVideoId, queryVideo } from './youtube';

export const registerYouTubeTools = (
  server: McpServer,
  env: Bindings,
): void => {
  server.registerTool(
    'get_youtube_video',
    {
      title: 'Get YouTube video',
      description:
        'Get details for one YouTube video from its URL or video ID. Returns title, creator, description, publish date, thumbnail and URL.',
      inputSchema: z.object({ url: text('YouTube video URL or video ID') }),
      annotations: READ_ONLY,
    },
    ({ url }) => {
      const videoId = extractVideoId(url);
      if (!videoId) {
        return {
          content: [
            { type: 'text', text: `Invalid YouTube URL or video ID: ${url}` },
          ],
          isError: true,
        };
      }
      return runTool(
        () => queryVideo(env.YOUTUBE_KEY, videoId),
        `No video found for URL: ${url}`,
      );
    },
  );
};
