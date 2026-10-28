import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import type { Bindings } from '../common/typings';
import { READ_ONLY, int, optionalText, runTool, text } from '../mcp/helpers';
import { qobuzCredentials } from './handler';
import { STORE, searchAlbums } from './qobuz';

export const registerQobuzTools = (server: McpServer, env: Bindings): void => {
  server.registerTool(
    'search_qobuz_albums',
    {
      title: 'Search Qobuz albums',
      description:
        'Search the Qobuz catalog for albums by title. Returns matching albums with their Qobuz store URL (`storeUrl`) and player URL (`playerUrl`).',
      inputSchema: z.object({
        title: text('Album title'),
        artist: optionalText('Artist name to narrow the search'),
        store: z
          .string()
          .trim()
          .toLowerCase()
          .regex(STORE)
          .optional()
          .describe(
            'Store region and language for store URLs (default "us-en", e.g. "gb-en", "fr-fr")',
          ),
        limit: int('Maximum number of results (default 10)', { max: 50 }),
        offset: int('Number of results to skip (default 0)', {
          min: 0,
          max: 10000,
        }),
      }),
      annotations: READ_ONLY,
    },
    ({ title, ...options }) =>
      runTool(() => searchAlbums(qobuzCredentials(env), title, options)),
  );
};
