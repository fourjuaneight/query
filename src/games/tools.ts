import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import type { Bindings } from '../common/typings';
import { READ_ONLY, id, int, runTool, text } from '../mcp/helpers';
import { queryGame, queryGameById, searchGames } from './igdb';

export const registerGameTools = (server: McpServer, env: Bindings): void => {
  server.registerTool(
    'search_games',
    {
      title: 'Search games',
      description:
        'Search IGDB for video games. Returns a list of matching games.',
      inputSchema: z.object({
        query: text('Search terms'),
        limit: int('Maximum number of results', { max: 500 }),
      }),
      annotations: READ_ONLY,
    },
    ({ query, limit }) => runTool(() => searchGames(env, query, { limit })),
  );

  server.registerTool(
    'find_game',
    {
      title: 'Find game',
      description:
        'Find the single best IGDB match for a video game title. Returns the game details.',
      inputSchema: z.object({ title: text('Game title') }),
      annotations: READ_ONLY,
    },
    ({ title }) =>
      runTool(() => queryGame(env, title), `No game found for title: ${title}`),
  );

  server.registerTool(
    'get_game',
    {
      title: 'Get game by ID',
      description:
        'Get one video game by its IGDB ID. Returns the game details.',
      inputSchema: z.object({ id: id('IGDB game ID') }),
      annotations: READ_ONLY,
    },
    ({ id: gameId }) =>
      runTool(
        () => queryGameById(env, gameId),
        `No game found for ID: ${gameId}`,
      ),
  );
};
