import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ApiBody } from '../common/test-types';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TMDB_KEY: '',
  TWITCH_CLIENT_ID: '',
  TWITCH_CLIENT_SECRET: '',
  DISCOGS_TOKEN: '',
  GH_TOKEN: '',
  YOUTUBE_KEY: '',
  QOBUZ_APP_ID: '123456789',
  QOBUZ_USER_AUTH_TOKEN: 'test-token',
};

beforeEach(() => {
  mockFetch.mockReset();
});

const searchResponse = (
  items: unknown[],
  { limit = 10, offset = 0 } = {},
): Record<string, unknown> => ({
  query: 'OK Computer',
  albums: { limit, offset, total: items.length, items },
});

const okComputer = {
  id: '0634904078164',
  title: 'OK Computer',
  version: null,
  slug: 'ok-computer-radiohead',
  url: 'https://www.qobuz.com/fr-fr/album/ok-computer-radiohead/0634904078164',
  upc: '0634904078164',
  release_date_original: '1997-06-16',
  tracks_count: 12,
  hires: true,
  purchasable: true,
  streamable: true,
  artist: { id: 38619, name: 'Radiohead' },
  label: { id: 1, name: 'XL Recordings' },
  genre: { id: 2, name: 'Alternative & Indie' },
  image: {
    thumbnail:
      'https://static.qobuz.com/images/covers/64/81/0634904078164_50.jpg',
    small: 'https://static.qobuz.com/images/covers/64/81/0634904078164_230.jpg',
    large: 'https://static.qobuz.com/images/covers/64/81/0634904078164_600.jpg',
  },
};

const airbag = {
  id: 1,
  title: 'Airbag',
  version: 'Remastered',
  track_number: 1,
  media_number: 1,
  duration: 287,
  isrc: 'GBAYE9700001',
  performer: { id: 38619, name: 'Radiohead' },
};

const ok = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200 });

/**
 * Answer album/search with `search`, and album/get with the tracks listed
 * for that album ID (none when it is not listed)
 */
const mockQobuz = (
  search: Record<string, unknown>,
  tracks: Record<string, unknown[]> = {},
): void => {
  mockFetch.mockImplementation((url: string) => {
    const { pathname, searchParams } = new URL(url);
    if (pathname.endsWith('/album/get')) {
      const items = tracks[searchParams.get('album_id') ?? ''] ?? [];
      return Promise.resolve(
        ok({ tracks: { limit: 1200, offset: 0, total: items.length, items } }),
      );
    }
    return Promise.resolve(ok(search));
  });
};

const requestUrl = (index = 0): URL =>
  new URL(String(mockFetch.mock.calls[index]?.[0]));

describe('Qobuz handlers', () => {
  describe('GET /qobuz/albums', () => {
    it('returns albums with store links and track lists', async () => {
      mockQobuz(searchResponse([okComputer]), { [okComputer.id]: [airbag] });

      const res = await app.request('/qobuz/albums?title=OK+Computer', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json<ApiBody>();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({
        results: [
          {
            id: '0634904078164',
            title: 'OK Computer',
            version: null,
            artist: 'Radiohead',
            releaseDate: '1997-06-16',
            label: 'XL Recordings',
            genre: 'Alternative & Indie',
            upc: '0634904078164',
            trackCount: 12,
            tracks: [
              {
                disc: 1,
                number: 1,
                title: 'Airbag',
                version: 'Remastered',
                artist: 'Radiohead',
                duration: 287,
                isrc: 'GBAYE9700001',
              },
            ],
            hiRes: true,
            purchasable: true,
            streamable: true,
            coverUrl:
              'https://static.qobuz.com/images/covers/64/81/0634904078164_600.jpg',
            storeUrl:
              'https://www.qobuz.com/us-en/album/ok-computer-radiohead/0634904078164',
            playerUrl: 'https://open.qobuz.com/album/0634904078164',
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      });
    });

    it('sends the app ID and user auth token on every request', async () => {
      mockQobuz(searchResponse([okComputer]));

      await app.request('/qobuz/albums?title=OK+Computer', {}, env);

      const calls = mockFetch.mock.calls as [string, RequestInit][];
      expect(calls.map(([url]) => new URL(url).pathname)).toEqual([
        '/api.json/0.2/album/search',
        '/api.json/0.2/album/get',
      ]);
      for (const [url, init] of calls) {
        expect(new URL(url).searchParams.get('app_id')).toBe('123456789');
        expect(init.headers).toEqual({
          'X-App-Id': '123456789',
          'X-User-Auth-Token': 'test-token',
        });
      }
      expect(requestUrl(1).searchParams.get('album_id')).toBe(okComputer.id);
    });

    it('fetches one track list per album', async () => {
      const other = { ...okComputer, id: 'other', slug: 'other' };
      mockQobuz(searchResponse([okComputer, other]), {
        [okComputer.id]: [airbag],
        other: [{ ...airbag, title: 'Other' }],
      });

      const res = await app.request('/qobuz/albums?title=OK+Computer', {}, env);

      const body = await res.json<ApiBody>();
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(body.data.results[0].tracks[0].title).toBe('Airbag');
      expect(body.data.results[1].tracks[0].title).toBe('Other');
    });

    it.each(['false', '0'])('skips track lists with tracks=%s', async value => {
      mockQobuz(searchResponse([okComputer]));

      const res = await app.request(
        `/qobuz/albums?title=OK+Computer&tracks=${value}`,
        {},
        env,
      );

      const body = await res.json<ApiBody>();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(body.data.results[0].tracks).toBeNull();
      expect(body.data.results[0].trackCount).toBe(12);
    });

    it('handles minimal tracks and albums without a track list', async () => {
      mockQobuz(searchResponse([okComputer]), {
        [okComputer.id]: [{ id: 2, title: 'Untitled' }],
      });

      const res = await app.request('/qobuz/albums?title=OK+Computer', {}, env);

      const body = await res.json<ApiBody>();
      expect(body.data.results[0].tracks).toEqual([
        {
          disc: null,
          number: null,
          title: 'Untitled',
          version: null,
          artist: null,
          duration: null,
          isrc: null,
        },
      ]);

      mockFetch.mockReset();
      mockFetch.mockImplementation((url: string) =>
        Promise.resolve(
          ok(
            url.includes('/album/get')
              ? { id: okComputer.id }
              : searchResponse([okComputer]),
          ),
        ),
      );
      const bare = await app.request(
        '/qobuz/albums?title=OK+Computer&store=fr-fr',
        {},
        env,
      );
      expect((await bare.json<ApiBody>()).data.results[0].tracks).toEqual([]);
    });

    it('passes artist, limit and offset options', async () => {
      mockQobuz(searchResponse([], { limit: 5, offset: 10 }));

      const res = await app.request(
        '/qobuz/albums?title=OK+Computer&artist=Radiohead&limit=5&offset=10',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const url = requestUrl();
      expect(url.searchParams.get('query')).toBe('OK Computer Radiohead');
      expect(url.searchParams.get('limit')).toBe('5');
      expect(url.searchParams.get('offset')).toBe('10');
    });

    it('builds store links for the requested store', async () => {
      mockQobuz(searchResponse([okComputer]));

      const res = await app.request(
        '/qobuz/albums?title=OK+Computer&store=GB-en',
        {},
        env,
      );

      const body = await res.json<ApiBody>();
      expect(body.data.results[0].storeUrl).toBe(
        'https://www.qobuz.com/gb-en/album/ok-computer-radiohead/0634904078164',
      );
    });

    it('falls back to the API URL, then null, without a slug', async () => {
      const noSlug = { ...okComputer, slug: undefined };
      const noUrl = { ...noSlug, url: undefined };
      mockQobuz(searchResponse([noSlug, noUrl]));

      const res = await app.request('/qobuz/albums?title=OK+Computer', {}, env);

      const body = await res.json<ApiBody>();
      expect(body.data.results[0].storeUrl).toBe(okComputer.url);
      expect(body.data.results[1].storeUrl).toBeNull();
      expect(body.data.results[1].playerUrl).toBe(
        'https://open.qobuz.com/album/0634904078164',
      );
    });

    it('handles minimal albums', async () => {
      mockQobuz(searchResponse([{ id: 'abc123', title: 'Untitled' }]));

      const res = await app.request('/qobuz/albums?title=Untitled', {}, env);

      const body = await res.json<ApiBody>();
      expect(body.data.results[0]).toMatchObject({
        artist: '',
        version: null,
        releaseDate: null,
        label: null,
        upc: null,
        trackCount: null,
        tracks: [],
        hiRes: false,
        coverUrl: null,
        storeUrl: null,
      });
    });

    it('returns 400 when title is missing', async () => {
      const res = await app.request('/qobuz/albums', {}, env);
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it.each(['usa', 'us_en', 'us-en-gb'])(
      'returns 400 for invalid store %s',
      async store => {
        const res = await app.request(
          `/qobuz/albums?title=OK+Computer&store=${store}`,
          {},
          env,
        );
        expect(res.status).toBe(400);
        expect(mockFetch).not.toHaveBeenCalled();
      },
    );

    it('returns 400 when limit is above 25', async () => {
      const res = await app.request(
        '/qobuz/albums?title=OK+Computer&limit=26',
        {},
        env,
      );
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 400 for an invalid tracks value', async () => {
      const res = await app.request(
        '/qobuz/albums?title=OK+Computer&tracks=maybe',
        {},
        env,
      );
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 502 when the API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('{"status":"error","code":401}', {
          status: 401,
          statusText: 'Unauthorized',
        }),
      );

      const res = await app.request('/qobuz/albums?title=OK+Computer', {}, env);
      expect(res.status).toBe(502);

      const body = await res.json<ApiBody>();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Qobuz: upstream request failed');
    });

    it('returns 502 when a track list request fails', async () => {
      mockFetch.mockImplementation((url: string) =>
        Promise.resolve(
          url.includes('/album/get')
            ? new Response('Server Error', { status: 500 })
            : ok(searchResponse([okComputer])),
        ),
      );

      const res = await app.request('/qobuz/albums?title=OK+Computer', {}, env);
      expect(res.status).toBe(502);
    });
  });
});
