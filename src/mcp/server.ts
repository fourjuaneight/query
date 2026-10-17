import { McpServer } from '@modelcontextprotocol/server';

import { name, version } from '../../package.json';
import type { Bindings } from '../common/typings';
import { registerBookTools } from '../books/tools';
import { registerGameTools } from '../games/tools';
import { registerMangaTools } from '../manga/tools';
import { registerMovieTools } from '../movies/tools';
import { registerMTGTools } from '../mtg/tools';
import { registerMusicTools } from '../music/tools';
import { registerPKMTools } from '../pkm/tools';
import { registerRepoTools } from '../repos/tools';
import { registerTVShowTools } from '../shows/tools';
import { registerYouTubeTools } from '../yt/tools';

/**
 * Build an MCP server that exposes every API route as a read-only tool.
 * A fresh server is built for each request (stateless serving).
 *
 * @param env - Worker bindings holding the 3rd-party API credentials
 * @returns The MCP server
 */
export const createMcpServer = (env: Bindings): McpServer => {
  const server = new McpServer(
    { name, version },
    {
      // The tool list never changes, so clients need not listen for updates
      capabilities: { tools: { listChanged: false } },
      instructions:
        'Look up books, games, manga, movies, TV shows, Magic: The Gathering and Pokémon cards, music, GitHub repositories and YouTube videos. Tool results are JSON.',
    },
  );

  registerBookTools(server);
  registerGameTools(server, env);
  registerMangaTools(server);
  registerMovieTools(server, env);
  registerTVShowTools(server, env);
  registerMTGTools(server);
  registerPKMTools(server);
  registerMusicTools(server, env);
  registerRepoTools(server, env);
  registerYouTubeTools(server, env);

  return server;
};
