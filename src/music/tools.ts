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
import {
  MAX_ALBUMS_PER_PAGE,
  searchAlbum,
  searchArtist,
  searchTrack,
} from './deezer';

const perPage = (max: number): z.ZodOptional<z.ZodNumber> =>
  int('Results per page (default 10)', { max });

const artist = optionalText(
  'Artist name. Only results by this artist are kept, so a page can have fewer results than perPage',
);

export const registerMusicTools = (server: McpServer): void => {
  server.registerTool(
    'search_music_artists',
    {
      title: 'Search music artists',
      description:
        'Search Deezer for music artists by name. Returns a page of matching artists.',
      inputSchema: z.object({
        name: text('Artist name'),
        page: page(),
        perPage: perPage(100),
      }),
      annotations: READ_ONLY,
    },
    ({ name, ...options }) => runTool(() => searchArtist(name, options)),
  );

  server.registerTool(
    'search_music_albums',
    {
      title: 'Search music albums',
      description:
        'Search Deezer for albums by title. Returns a page of matching albums with release date, genres, label and UPC.',
      inputSchema: z.object({
        title: text('Album title'),
        artist,
        page: page(),
        perPage: perPage(MAX_ALBUMS_PER_PAGE),
        details: z
          .boolean()
          .optional()
          .describe(
            'Fetch release date, genres, label and UPC for every album (default true)',
          ),
      }),
      annotations: READ_ONLY,
    },
    ({ title, ...options }) => runTool(() => searchAlbum(title, options)),
  );

  server.registerTool(
    'search_music_tracks',
    {
      title: 'Search music tracks',
      description:
        'Search Deezer for tracks by title. Returns a page of matching tracks with their album.',
      inputSchema: z.object({
        track: text('Track title'),
        artist,
        page: page(),
        perPage: perPage(100),
      }),
      annotations: READ_ONLY,
    },
    ({ track, ...options }) => runTool(() => searchTrack(track, options)),
  );
};
