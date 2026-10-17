import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import {
  READ_ONLY,
  int,
  optionalText,
  page,
  runTool,
  text,
} from '../mcp/helpers';
import { DEFAULT_LIMIT, MAX_LIMIT, getPKMCard } from './tcgdex';

export const registerPKMTools = (server: McpServer): void => {
  server.registerTool(
    'get_pokemon_card',
    {
      title: 'Get Pokémon TCG card',
      description:
        'Find Pokémon Trading Card Game cards on TCGdex by name, optionally narrowed by set. Returns a list of matching cards.',
      inputSchema: z.object({
        name: text('Card name'),
        set: optionalText(
          'TCGdex set ID (e.g. "base1", "sv03.5"); set names do not match',
        ),
        limit: int(`Maximum number of results (default ${DEFAULT_LIMIT})`, {
          max: MAX_LIMIT,
        }),
        page: page(),
      }),
      annotations: READ_ONLY,
    },
    query => runTool(() => getPKMCard(query)),
  );
};
