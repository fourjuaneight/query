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
import { searchAlbum, searchArtist, searchTrack } from './discogs';

const pagination = {
  page: page(),
  perPage: int('Results per page', { max: 100 }),
};

const filters = {
  artist: optionalText('Artist name to filter by'),
  year: optionalText('Release year to filter by (e.g. "1977")'),
  genre: optionalText('Genre to filter by (e.g. "Rock")'),
};

export const registerMusicTools = (server: McpServer, env: Bindings): void => {
  server.registerTool(
    'search_music_artists',
    {
      title: 'Search music artists',
      description:
        'Search Discogs for music artists by name. Returns a page of matching artists.',
      inputSchema: z.object({ name: text('Artist name'), ...pagination }),
      annotations: READ_ONLY,
    },
    ({ name, ...options }) =>
      runTool(() => searchArtist(env.DISCOGS_TOKEN, name, options)),
  );

  server.registerTool(
    'search_music_albums',
    {
      title: 'Search music albums',
      description:
        'Search Discogs for albums (releases) by title. Returns a page of matching albums.',
      inputSchema: z.object({
        title: text('Album title'),
        ...filters,
        ...pagination,
      }),
      annotations: READ_ONLY,
    },
    ({ title, ...options }) =>
      runTool(() => searchAlbum(env.DISCOGS_TOKEN, title, options)),
  );

  server.registerTool(
    'search_music_tracks',
    {
      title: 'Search music tracks',
      description:
        'Search Discogs for releases that contain a track title. Returns a page of matching tracks.',
      inputSchema: z.object({
        track: text('Track title'),
        ...filters,
        ...pagination,
      }),
      annotations: READ_ONLY,
    },
    ({ track, ...options }) =>
      runTool(() => searchTrack(env.DISCOGS_TOKEN, track, options)),
  );
};
