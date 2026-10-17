import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import { READ_ONLY, int, runTool, text } from '../mcp/helpers';
import { getMangaDetails, searchManga } from './mangadex';

export const registerMangaTools = (server: McpServer): void => {
  server.registerTool(
    'search_manga',
    {
      title: 'Search manga',
      description:
        'Search MangaDex for manga by title. Returns a list of matches.',
      inputSchema: z.object({
        title: text('Manga title to search for'),
        limit: int('Maximum number of results', { max: 100 }),
        offset: int('Number of results to skip', { min: 0, max: 10000 }),
      }),
      annotations: READ_ONLY,
    },
    ({ title, ...options }) => runTool(() => searchManga(title, options)),
  );

  server.registerTool(
    'get_manga',
    {
      title: 'Get manga by ID',
      description:
        'Get one manga by its MangaDex UUID. Returns the manga details.',
      inputSchema: z.object({ id: z.uuid().describe('MangaDex manga UUID') }),
      annotations: READ_ONLY,
    },
    ({ id }) => runTool(() => getMangaDetails(id)),
  );
};
