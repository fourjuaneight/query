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

// One valid call per tool, with the upstream service it must reach
const toolCases: [string, Record<string, unknown>, string][] = [
  ['get_book_by_isbn', { isbn: '9780451524935' }, 'OpenLibrary'],
  ['search_books', { title: '1984' }, 'OpenLibrary'],
  ['search_games', { query: 'zelda' }, 'Twitch'],
  ['find_game', { title: 'zelda' }, 'Twitch'],
  ['get_game', { id: 1 }, 'Twitch'],
  ['search_manga', { title: 'berserk' }, 'MangaDex'],
  ['get_manga', { id: '801513ba-a712-498c-8f57-cae55b38cc92' }, 'MangaDex'],
  ['find_movie', { title: 'Alien' }, 'TMDB'],
  ['search_movies', { query: 'Alien' }, 'TMDB'],
  ['get_movie', { id: 348 }, 'TMDB'],
  ['find_tv_show', { title: 'Severance' }, 'TMDB'],
  ['search_tv_shows', { query: 'Severance' }, 'TMDB'],
  ['get_tv_show', { id: 95396 }, 'TMDB'],
  ['get_mtg_card', { name: 'Black Lotus' }, 'Scryfall'],
  ['get_pokemon_card', { name: 'Pikachu' }, 'TCGdex'],
  ['search_music_artists', { name: 'Rush' }, 'Discogs'],
  ['search_music_albums', { title: 'Moving Pictures' }, 'Discogs'],
  ['search_music_tracks', { track: 'Tom Sawyer' }, 'Discogs'],
  ['search_repos', { query: 'hono' }, 'GitHub'],
  ['get_repo', { name: 'honojs/hono' }, 'GitHub'],
  ['get_youtube_video', { url: 'https://youtu.be/dQw4w9WgXcQ' }, 'YouTube'],
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

  it.each(toolCases)(
    '%s calls %s and hides upstream error details',
    async (name, args, service) => {
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
  ])('%s rejects invalid input %j', async (name, args) => {
    const result = await call(name, args);

    expect(result.isError).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
