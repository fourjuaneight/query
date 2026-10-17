import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import type { Bindings } from '../common/typings';
import {
  READ_ONLY,
  int,
  optionalText,
  page,
  runTool,
  text,
} from '../mcp/helpers';
import { queryRepo, searchRepos } from './github';
import { ORDERS, SORTS } from './handler';

export const registerRepoTools = (server: McpServer, env: Bindings): void => {
  server.registerTool(
    'search_repos',
    {
      title: 'Search GitHub repositories',
      description:
        'Search GitHub repositories. Returns a page of matching repositories with the total count.',
      inputSchema: z.object({
        query: text('Search terms (GitHub search syntax is allowed)'),
        language: optionalText('Programming language to filter by'),
        sort: z
          .enum(SORTS)
          .optional()
          .describe(
            'Sort field (default "stars"; "best-match" sorts by relevance)',
          ),
        order: z
          .enum(ORDERS)
          .optional()
          .describe('Sort order (default "desc")'),
        page: page(),
        perPage: int('Results per page (default 10)', { max: 100 }),
      }),
      annotations: READ_ONLY,
    },
    ({ query, ...options }) =>
      runTool(() => searchRepos(env.GH_TOKEN, query, options)),
  );

  server.registerTool(
    'get_repo',
    {
      title: 'Get GitHub repository',
      description:
        'Get one GitHub repository by "owner/name" (or the best match for a bare name). Returns the repository details.',
      inputSchema: z.object({
        name: text('Repository as "owner/name", or a bare name'),
      }),
      annotations: READ_ONLY,
    },
    ({ name }) =>
      runTool(
        () => queryRepo(env.GH_TOKEN, name),
        `No repo found for name: ${name}`,
      ),
  );
};
