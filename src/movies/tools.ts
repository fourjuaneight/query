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
import { queryMovie, queryMovieById, searchMovies } from './tmdb';

export const registerMovieTools = (server: McpServer, env: Bindings): void => {
  server.registerTool(
    'find_movie',
    {
      title: 'Find movie',
      description:
        'Find the single best TMDB match for a movie title. Returns the movie details.',
      inputSchema: z.object({
        title: text('Movie title'),
        language,
        year,
      }),
      annotations: READ_ONLY,
    },
    ({ title, ...options }) =>
      runTool(
        () => queryMovie(env.TMDB_KEY, title, options),
        `No movie found for title: ${title}`,
      ),
  );

  server.registerTool(
    'search_movies',
    {
      title: 'Search movies',
      description:
        'Search TMDB for movies. Returns a page of results with the total count.',
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
      runTool(() => searchMovies(env.TMDB_KEY, query, options)),
  );

  server.registerTool(
    'get_movie',
    {
      title: 'Get movie by ID',
      description: 'Get one movie by its TMDB ID. Returns the movie details.',
      inputSchema: z.object({ id: id('TMDB movie ID'), language }),
      annotations: READ_ONLY,
    },
    ({ id: movieId, language: lang }) =>
      runTool(() => queryMovieById(env.TMDB_KEY, movieId, lang)),
  );
};
