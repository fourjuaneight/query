import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ApiBody } from '../common/test-types';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TMDB_KEY: '',
  TWITCH_CLIENT_ID: '',
  TWITCH_CLIENT_SECRET: '',
  GH_TOKEN: '',
  YOUTUBE_KEY: '',
};

beforeEach(() => {
  mockFetch.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const ok = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200 });

const page = (
  data: unknown[],
  total = data.length,
): Record<string, unknown> => ({
  data,
  total,
});

const requestUrl = (index = 0): URL =>
  new URL(String(mockFetch.mock.calls[index]?.[0]));

const okComputer = {
  id: 6575789,
  title: 'OK Computer',
  link: 'https://www.deezer.com/album/6575789',
  cover_xl:
    'https://cdn-images.dzcdn.net/images/cover/abc/1000x1000-000000-80-0-0.jpg',
  nb_tracks: 12,
  record_type: 'album',
  explicit_lyrics: false,
  artist: { id: 399, name: 'Radiohead' },
};

const okComputerDetails = {
  ...okComputer,
  upc: '634904078164',
  label: 'XL Recordings',
  release_date: '1997-06-16',
  genres: {
    data: [
      { id: 152, name: 'Rock' },
      { id: 85, name: 'Alternative' },
    ],
  },
};

/**
 * Answer search requests with `search`, and album/{id} with `details`
 */
const mockDeezer = (
  search: Record<string, unknown>,
  details: Record<string, unknown> = okComputerDetails,
): void => {
  mockFetch.mockImplementation((url: string) =>
    Promise.resolve(
      ok(new URL(url).pathname.startsWith('/album/') ? details : search),
    ),
  );
};

describe('Music handlers', () => {
  describe('GET /music/artists', () => {
    it('returns artist search results', async () => {
      mockDeezer(
        page([
          {
            id: 399,
            name: 'Radiohead',
            link: 'https://www.deezer.com/artist/399',
            picture_xl:
              'https://cdn-images.dzcdn.net/images/artist/r/1000x1000.jpg',
            nb_album: 42,
            nb_fan: 3000000,
          },
        ]),
      );

      const res = await app.request('/music/artists?name=Radiohead', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json<ApiBody>();
      expect(body).toEqual({
        success: true,
        data: {
          results: [
            {
              id: 399,
              name: 'Radiohead',
              albums: 42,
              fans: 3000000,
              pictureUrl:
                'https://cdn-images.dzcdn.net/images/artist/r/1000x1000.jpg',
              url: 'https://www.deezer.com/artist/399',
            },
          ],
          totalResults: 1,
          totalPages: 1,
          page: 1,
        },
      });

      const url = requestUrl();
      expect(url.origin + url.pathname).toBe(
        'https://api.deezer.com/search/artist',
      );
      expect(url.searchParams.get('q')).toBe('Radiohead');
    });

    it('maps page and per_page to index and limit', async () => {
      mockDeezer(page([], 42));

      const res = await app.request(
        '/music/artists?name=Radiohead&page=3&per_page=5',
        {},
        env,
      );

      const body = await res.json<ApiBody>();
      expect(body.data).toEqual({
        results: [],
        totalResults: 42,
        totalPages: 9,
        page: 3,
      });
      expect(requestUrl().searchParams.get('index')).toBe('10');
      expect(requestUrl().searchParams.get('limit')).toBe('5');
    });

    it('handles a page without data or total', async () => {
      mockDeezer({});

      const res = await app.request('/music/artists?name=Radiohead', {}, env);

      const body = await res.json<ApiBody>();
      expect(body.data).toEqual({
        results: [],
        totalResults: 0,
        totalPages: 0,
        page: 1,
      });
    });

    it('returns 502 when the API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/music/artists?name=Radiohead', {}, env);
      expect(res.status).toBe(502);

      const body = await res.json<ApiBody>();
      expect(body).toEqual({
        success: false,
        error: 'Deezer: upstream request failed',
      });
    });

    it.each([
      [
        4,
        'Exception',
        'Quota limit exceeded',
        429,
        'Deezer: rate limit exceeded',
      ],
      [800, 'DataException', 'no data', 404, 'Deezer: not found'],
      [
        700,
        'Exception',
        'Service busy',
        502,
        'Deezer: upstream request failed',
      ],
    ])(
      'maps Deezer error code %i (HTTP 200) to %i',
      async (code, type, message, status, error) => {
        mockDeezer({ error: { type, message, code } });

        const res = await app.request('/music/artists?name=Radiohead', {}, env);
        expect(res.status).toBe(status);

        const body = await res.json<ApiBody>();
        expect(body).toEqual({ success: false, error });
      },
    );

    it('returns 400 when per_page is above 100', async () => {
      const res = await app.request(
        '/music/artists?name=Radiohead&per_page=101',
        {},
        env,
      );
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('GET /music/albums', () => {
    it('returns albums with their details', async () => {
      mockDeezer(page([okComputer]));

      const res = await app.request('/music/albums?title=OK+Computer', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json<ApiBody>();
      expect(body.data.results).toEqual([
        {
          id: 6575789,
          title: 'OK Computer',
          artist: 'Radiohead',
          type: 'album',
          tracks: 12,
          explicit: false,
          releaseDate: '1997-06-16',
          genres: ['Rock', 'Alternative'],
          label: 'XL Recordings',
          upc: '634904078164',
          coverUrl: okComputer.cover_xl,
          url: 'https://www.deezer.com/album/6575789',
        },
      ]);

      expect(requestUrl(0).pathname).toBe('/search/album');
      expect(requestUrl(0).searchParams.get('q')).toBe('OK Computer');
      expect(requestUrl(1).pathname).toBe('/album/6575789');
    });

    it('fetches details for every album', async () => {
      mockDeezer(page([okComputer, { ...okComputer, id: 1 }]));

      await app.request('/music/albums?title=OK+Computer', {}, env);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it.each(['false', '0'])('skips details with details=%s', async value => {
      mockDeezer(page([okComputer]));

      const res = await app.request(
        `/music/albums?title=OK+Computer&details=${value}`,
        {},
        env,
      );

      const body = await res.json<ApiBody>();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(body.data.results[0]).toMatchObject({
        title: 'OK Computer',
        releaseDate: null,
        genres: [],
        label: null,
        upc: null,
      });
    });

    it('searches by artist with quoted advanced-search fields', async () => {
      mockDeezer(page([]));

      const res = await app.request(
        '/music/albums?title=OK+%22Computer%22&artist=Radiohead&page=2&per_page=5',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const url = requestUrl();
      expect(url.searchParams.get('q')).toBe(
        'artist:"Radiohead" album:"OK Computer"',
      );
      expect(url.searchParams.get('index')).toBe('5');
      expect(url.searchParams.get('limit')).toBe('5');
    });

    it('handles minimal albums and details', async () => {
      mockDeezer(page([{ id: 1, title: 'Untitled', link: 'https://x/1' }]), {
        id: 1,
      });

      const res = await app.request('/music/albums?title=Untitled', {}, env);

      const body = await res.json<ApiBody>();
      expect(body.data.results[0]).toEqual({
        id: 1,
        title: 'Untitled',
        artist: '',
        type: null,
        tracks: null,
        explicit: false,
        releaseDate: null,
        genres: [],
        label: null,
        upc: null,
        coverUrl: null,
        url: 'https://x/1',
      });
    });

    it('returns 502 when a details request fails', async () => {
      mockDeezer(page([okComputer]), {
        error: { type: 'Exception', message: 'Service busy', code: 700 },
      });

      const res = await app.request('/music/albums?title=OK+Computer', {}, env);
      expect(res.status).toBe(502);
    });

    it('returns 400 when per_page is above 25', async () => {
      const res = await app.request(
        '/music/albums?title=OK+Computer&per_page=26',
        {},
        env,
      );
      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns 400 for an invalid details value', async () => {
      const res = await app.request(
        '/music/albums?title=OK+Computer&details=maybe',
        {},
        env,
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 when title is missing', async () => {
      const res = await app.request('/music/albums', {}, env);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /music/tracks', () => {
    it('returns track search results', async () => {
      mockDeezer(
        page([
          {
            id: 3135556,
            title: 'Karma Police',
            link: 'https://www.deezer.com/track/3135556',
            duration: 264,
            explicit_lyrics: false,
            preview: 'https://cdnt-preview.dzcdn.net/karma.mp3',
            artist: { id: 399, name: 'Radiohead' },
            album: {
              id: 6575789,
              title: 'OK Computer',
              cover_xl: okComputer.cover_xl,
            },
          },
        ]),
      );

      const res = await app.request(
        '/music/tracks?track=Karma+Police',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json<ApiBody>();
      expect(body.data.results).toEqual([
        {
          id: 3135556,
          title: 'Karma Police',
          artist: 'Radiohead',
          album: 'OK Computer',
          duration: 264,
          explicit: false,
          previewUrl: 'https://cdnt-preview.dzcdn.net/karma.mp3',
          coverUrl: okComputer.cover_xl,
          url: 'https://www.deezer.com/track/3135556',
        },
      ]);
      expect(requestUrl().pathname).toBe('/search/track');
    });

    it('searches by artist and handles minimal tracks', async () => {
      mockDeezer(
        page([{ id: 1, title: 'Untitled', link: 'https://x/1', preview: '' }]),
      );

      const res = await app.request(
        '/music/tracks?track=Lucky&artist=Radiohead&per_page=3',
        {},
        env,
      );

      const body = await res.json<ApiBody>();
      expect(body.data.results[0]).toEqual({
        id: 1,
        title: 'Untitled',
        artist: '',
        album: '',
        duration: null,
        explicit: false,
        previewUrl: null,
        coverUrl: null,
        url: 'https://x/1',
      });
      expect(requestUrl().searchParams.get('q')).toBe(
        'artist:"Radiohead" track:"Lucky"',
      );
      expect(requestUrl().searchParams.get('limit')).toBe('3');
    });

    it('returns 400 when track is missing', async () => {
      const res = await app.request('/music/tracks', {}, env);
      expect(res.status).toBe(400);
    });
  });
});
