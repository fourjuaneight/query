import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import type { Bindings } from '../common/typings';
import {
  READ_ONLY,
  id,
  language,
  page,
  runTool,
  text,
  year,
} from '../mcp/helpers';
import { queryTVShow, queryTVShowById, searchTVShows } from './tmdb';

export const registerTVShowTools = (server: McpServer, env: Bindings): void => {
  server.registerTool(
    'find_tv_show',
    {
      title: 'Find TV show',
      description:
        'Find the single best TMDB match for a TV show title. Returns the TV show details.',
      inputSchema: z.object({
        title: text('TV show title'),
        language,
        year,
      }),
      annotations: READ_ONLY,
    },
    ({ title, ...options }) =>
      runTool(
        () => queryTVShow(env.TMDB_KEY, title, options),
        `No TV show found for title: ${title}`,
      ),
  );

  server.registerTool(
    'search_tv_shows',
    {
      title: 'Search TV shows',
      description:
        'Search TMDB for TV shows. Returns a page of results with the total count.',
      inputSchema: z.object({
        query: text('Search terms'),
        language,
        year,
        page: page(500),
        details: z
          .boolean()
          .optional()
          .describe('Fetch full details for every result (default true)'),
      }),
      annotations: READ_ONLY,
    },
    ({ query, ...options }) =>
      runTool(() => searchTVShows(env.TMDB_KEY, query, options)),
  );

  server.registerTool(
    'get_tv_show',
    {
      title: 'Get TV show by ID',
      description:
        'Get one TV show by its TMDB ID. Returns the TV show details.',
      inputSchema: z.object({ id: id('TMDB series ID'), language }),
      annotations: READ_ONLY,
    },
    ({ id: tvId, language: lang }) =>
      runTool(() => queryTVShowById(env.TMDB_KEY, tvId, lang)),
  );
};
