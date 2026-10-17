import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import { READ_ONLY, optionalText, runTool, text } from '../mcp/helpers';
import { getMTGCard } from './scryfall';

export const registerMTGTools = (server: McpServer): void => {
  server.registerTool(
    'get_mtg_card',
    {
      title: 'Get Magic: The Gathering card',
      description:
        'Find Magic: The Gathering cards on Scryfall by name. Returns matching cards with one printing each; pass set and number for a specific printing.',
      inputSchema: z.object({
        name: text('Card name'),
        set: optionalText('Set code (e.g. "neo")'),
        number: optionalText('Collector number within the set'),
      }),
      annotations: READ_ONLY,
    },
    query => runTool(() => getMTGCard(query)),
  );
};
