import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import type { CallToolResult } from '@modelcontextprotocol/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { Bindings } from '../common/typings';
import { createMcpServer } from './server';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env: Bindings = {
  TMDB_KEY: 'tmdb',
  TWITCH_CLIENT_ID: 'twitch-id',
  TWITCH_CLIENT_SECRET: 'twitch-secret',
  DISCOGS_TOKEN: 'discogs',
  GH_TOKEN: 'gh',
  YOUTUBE_KEY: 'yt',
  QOBUZ_APP_ID: 'qobuz-app',
  QOBUZ_USER_AUTH_TOKEN: 'qobuz-token',
};

let client: Client;

beforeEach(async () => {
  mockFetch.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await createMcpServer(env).connect(serverTransport);
  client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(clientTransport);
});

afterEach(async () => {
  await client.close();
  vi.restoreAllMocks();
});

const call = (
  name: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> => client.callTool({ name, arguments: args });

const textOf = (result: CallToolResult): string => {
  const [first] = result.content;
  return first?.type === 'text' ? first.text : '';
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

// One valid call per tool, with the upstream service it reaches first
const toolCases: [string, string, Record<string, unknown>][] = [
  ['get_book_by_isbn', 'OpenLibrary', { isbn: '9780451524935' }],
  ['search_books', 'OpenLibrary', { title: '1984' }],
  ['search_games', 'Twitch', { query: 'zelda' }],
  ['find_game', 'Twitch', { title: 'zelda' }],
  ['get_game', 'Twitch', { id: 1 }],
  ['search_manga', 'MangaDex', { title: 'berserk' }],
  ['get_manga', 'MangaDex', { id: '801513ba-a712-498c-8f57-cae55b38cc92' }],
  ['find_movie', 'TMDB', { title: 'Alien' }],
  ['search_movies', 'TMDB', { query: 'Alien' }],
  ['get_movie', 'TMDB', { id: 348 }],
  ['find_tv_show', 'TMDB', { title: 'Severance' }],
  ['search_tv_shows', 'TMDB', { query: 'Severance' }],
  ['get_tv_show', 'TMDB', { id: 95396 }],
  ['get_mtg_card', 'Scryfall', { name: 'Black Lotus' }],
  ['get_pokemon_card', 'TCGdex', { name: 'Pikachu' }],
  ['search_music_artists', 'Discogs', { name: 'Rush' }],
  ['search_music_albums', 'Discogs', { title: 'Moving Pictures' }],
  ['search_music_tracks', 'Discogs', { track: 'Tom Sawyer' }],
  ['search_qobuz_albums', 'Qobuz', { title: 'OK Computer' }],
  ['search_repos', 'GitHub', { query: 'hono' }],
  ['get_repo', 'GitHub', { name: 'honojs/hono' }],
  ['get_youtube_video', 'YouTube', { url: 'https://youtu.be/dQw4w9WgXcQ' }],
];

describe('MCP server', () => {
  it('lists one read-only tool per API route', async () => {
    const { tools } = await client.listTools();

    expect(tools.map(tool => tool.name).sort()).toEqual(
      toolCases.map(([name]) => name).sort(),
    );
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  // Runs before any test below caches a Twitch token for the game tools
  it.each(toolCases)(
    '%s calls %s and hides upstream error details',
    async (name, service, args) => {
      mockFetch.mockResolvedValue(
        new Response('secret upstream body', {
          status: 500,
          statusText: 'Internal',
        }),
      );

      const result = await call(name, args);

      expect(mockFetch).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(textOf(result)).toBe(`${service}: upstream request failed`);
    },
  );

  it('returns tool data as JSON text', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        numFound: 1,
        docs: [
          {
            title: '1984',
            author_name: ['George Orwell'],
            first_publish_year: 1949,
            isbn: ['9780451524935', '0451524934'],
          },
        ],
      }),
    );

    const result = await call('search_books', { title: '1984', limit: 1 });

    expect(result.isError).toBeFalsy();
    const books = JSON.parse(textOf(result)) as { title: string }[];
    expect(books[0]?.title).toBe('1984');

    const url = new URL(String(mockFetch.mock.calls[0]?.[0]));
    expect(url.searchParams.get('title')).toBe('1984');
    expect(url.searchParams.get('limit')).toBe('1');
  });

  it('returns a not-found tool error when nothing matches', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ records: {}, items: [] }));

    const result = await call('get_book_by_isbn', { isbn: '0000000000' });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe('No book found for ISBN: 0000000000');
  });

  it('maps upstream 404 and 429 like the REST API', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 404 }));
    expect(textOf(await call('get_movie', { id: 1 }))).toBe('TMDB: not found');

    mockFetch.mockResolvedValueOnce(new Response('', { status: 429 }));
    expect(textOf(await call('get_movie', { id: 1 }))).toBe(
      'TMDB: rate limit exceeded',
    );
  });

  it('rejects an invalid YouTube URL without calling the API', async () => {
    const result = await call('get_youtube_video', { url: 'not a video' });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('Invalid YouTube URL or video ID');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each<[string, Record<string, unknown>]>([
    ['search_books', { title: '' }],
    ['search_books', { title: '1984', limit: 0 }],
    ['search_books', { title: '1984', limit: 101 }],
    ['search_manga', { title: 'x', offset: -1 }],
    ['get_manga', { id: 'not-a-uuid' }],
    ['get_movie', { id: 1.5 }],
    ['find_movie', { title: 'Alien', year: 1700 }],
    ['get_pokemon_card', { name: 'Pikachu', limit: 41 }],
    ['search_repos', { query: 'hono', sort: 'popular' }],
    ['search_qobuz_albums', { title: 'OK Computer', store: 'usa' }],
    ['search_qobuz_albums', { title: 'OK Computer', limit: 26 }],
    ['search_qobuz_albums', { title: 'OK Computer', tracks: 'no' }],
  ])('%s rejects invalid input %j', async (name, args) => {
    const result = await call(name, args);

    expect(result.isError).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ── Argument forwarding ────────────────────────────────────────────────────

  // [tool, arguments, query params expected on the first upstream request]
  const forwardingCases: [
    string,
    Record<string, unknown>,
    Record<string, string>,
  ][] = [
    [
      'search_books',
      { title: '1984', limit: 5, page: 2, language: 'eng' },
      { title: '1984', limit: '5', page: '2', lang: 'eng' },
    ],
    [
      'search_manga',
      { title: 'Berserk', limit: 3, offset: 6 },
      { title: 'Berserk', limit: '3', offset: '6' },
    ],
    [
      'search_movies',
      { query: 'Alien', language: 'fr-FR', year: 1979, page: 2 },
      { query: 'Alien', language: 'fr-FR', year: '1979', page: '2' },
    ],
    [
      'find_tv_show',
      { title: 'Severance', year: 2022 },
      { query: 'Severance', first_air_date_year: '2022' },
    ],
    [
      'get_mtg_card',
      { name: 'Black Lotus', set: 'lea', number: '232' },
      { ['q']: 'Black Lotus s:lea cn:232' },
    ],
    [
      'get_pokemon_card',
      { name: 'Pikachu', set: 'base1' },
      { name: 'Pikachu', 'set.id': 'base1' },
    ],
    [
      'search_music_albums',
      {
        title: 'Moving Pictures',
        artist: 'Rush',
        year: '1981',
        genre: 'Rock',
        perPage: 5,
        page: 2,
      },
      {
        release_title: 'Moving Pictures',
        artist: 'Rush',
        year: '1981',
        genre: 'Rock',
        per_page: '5',
        page: '2',
      },
    ],
    [
      'search_qobuz_albums',
      { title: 'OK Computer', artist: 'Radiohead', limit: 5, offset: 10 },
      { query: 'OK Computer Radiohead', limit: '5', offset: '10' },
    ],
    [
      'search_music_tracks',
      { track: 'Tom Sawyer', perPage: 3 },
      { track: 'Tom Sawyer', per_page: '3' },
    ],
    [
      'search_repos',
      {
        query: 'hono',
        language: 'TypeScript',
        sort: 'forks',
        order: 'asc',
        perPage: 5,
        page: 2,
      },
      {
        ['q']: 'hono language:TypeScript',
        sort: 'forks',
        order: 'asc',
        per_page: '5',
        page: '2',
      },
    ],
    [
      'get_youtube_video',
      { url: 'https://youtu.be/dQw4w9WgXcQ' },
      { id: 'dQw4w9WgXcQ' },
    ],
  ];

  it.each(forwardingCases)(
    '%s forwards its arguments',
    async (name, args, expected) => {
      mockFetch.mockResolvedValue(new Response('', { status: 500 }));

      await call(name, args);

      const url = new URL(String(mockFetch.mock.calls[0]?.[0]));
      for (const [key, value] of Object.entries(expected)) {
        expect(url.searchParams.get(key), key).toBe(value);
      }
    },
  );

  it('search_movies skips detail requests with details: false', async () => {
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(
        jsonResponse(
          url.includes('/genre/')
            ? { genres: [{ id: 27, name: 'Horror' }] }
            : {
                page: 1,
                total_results: 1,
                total_pages: 1,
                results: [
                  {
                    id: 348,
                    title: 'Alien',
                    release_date: '1979-05-25',
                    overview: '',
                    poster_path: null,
                    genre_ids: [27],
                  },
                ],
              },
        ),
      ),
    );

    const result = await call('search_movies', {
      query: 'Alien',
      details: false,
    });

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(textOf(result))).toMatchObject({
      results: [{ id: 348, genres: ['Horror'], director: null }],
    });
    // One search and one genre list, no per-movie details
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('search_qobuz_albums skips track lists with tracks: false', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        query: 'OK Computer',
        albums: {
          limit: 10,
          offset: 0,
          total: 1,
          items: [{ id: '0634904078164', title: 'OK Computer' }],
        },
      }),
    );

    const result = await call('search_qobuz_albums', {
      title: 'OK Computer',
      tracks: false,
    });

    expect(result.isError).toBeFalsy();
    const { results } = JSON.parse(textOf(result)) as {
      results: { tracks: unknown }[];
    };
    expect(results[0]?.tracks).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // ── IDs for the get_* tools ────────────────────────────────────────────────

  /** Twitch token for IGDB, then the given IGDB response. */
  const igdb = (games: unknown[]) => (url: string) =>
    Promise.resolve(
      url.startsWith('https://id.twitch.tv')
        ? jsonResponse({ access_token: 't', expires_in: 3600 })
        : jsonResponse(games),
    );

  it('search_games sends its query to IGDB and returns game ids', async () => {
    mockFetch.mockImplementation(igdb([{ id: 1942, name: 'The Witcher 3' }]));

    const result = await call('search_games', { query: 'witcher', limit: 3 });

    const [, init] =
      mockFetch.mock.calls.find(([url]) =>
        String(url).startsWith('https://api.igdb.com'),
      ) ?? [];
    const body = (init as RequestInit | undefined)?.body as string;
    expect(body).toContain('search "witcher"');
    expect(body).toContain('limit 3');
    expect(JSON.parse(textOf(result))).toMatchObject([
      { id: 1942, title: 'The Witcher 3' },
    ]);
  });

  it('search_manga returns the id that get_manga takes', async () => {
    const id = '801513ba-a712-498c-8f57-cae55b38cc92';
    mockFetch.mockResolvedValue(
      jsonResponse({
        data: [
          {
            id,
            attributes: {
              title: { en: 'Berserk' },
              description: {},
              year: 1989,
              status: 'ongoing',
            },
            relationships: [],
          },
        ],
      }),
    );

    const result = await call('search_manga', { title: 'Berserk' });

    expect(JSON.parse(textOf(result))).toMatchObject([
      { id, title: 'Berserk', url: `https://mangadex.org/title/${id}` },
    ]);
  });

  it('get_manga accepts any UUID-shaped ID, like the REST route', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 404 }));

    const result = await call('get_manga', {
      id: '00000000-0000-0000-0000-000000000000',
    });

    expect(textOf(result)).toBe('MangaDex: not found');
  });

  // ── Not-found messages match the REST API ──────────────────────────────────

  it.each<[string, Record<string, unknown>, unknown, string]>([
    ['find_game', { title: 'zzz' }, [], 'No game found for title: zzz'],
    [
      'find_movie',
      { title: 'zzz' },
      { page: 1, results: [], total_results: 0, total_pages: 0 },
      'No movie found for title: zzz',
    ],
    [
      'find_tv_show',
      { title: 'zzz' },
      { page: 1, results: [], total_results: 0, total_pages: 0 },
      'No TV show found for title: zzz',
    ],
    [
      'get_repo',
      { name: 'zzz' },
      { total_count: 0, items: [] },
      'No repo found for name: zzz',
    ],
    [
      'get_youtube_video',
      { url: 'dQw4w9WgXcQ' },
      { items: [] },
      'No video found for URL: dQw4w9WgXcQ',
    ],
  ])('%s reports not found', async (name, args, body, message) => {
    mockFetch.mockImplementation(igdb(body as unknown[]));

    const result = await call(name, args);

    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe(message);
  });
});
