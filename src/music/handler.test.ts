import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TMDB_KEY: '',
  TWITCH_CLIENT_ID: '',
  TWITCH_CLIENT_SECRET: '',
  DISCOGS_TOKEN: 'test-token',
  GITHUB_TOKEN: '',
  YOUTUBE_KEY: '',
};

beforeEach(() => {
  mockFetch.mockReset();
});

const discogsSearchResponse = (
  results: unknown[],
): Record<string, unknown> => ({
  pagination: {
    per_page: 10,
    items: results.length,
    page: 1,
    pages: 1,
    urls: {},
  },
  results,
});

describe('Music handlers', () => {
  describe('GET /music/artists', () => {
    it('returns artist search results', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify(
            discogsSearchResponse([
              {
                id: 1,
                type: 'artist',
                title: 'Radiohead',
                uri: '',
                resource_url: '',
                thumb: '',
                cover_image: 'https://example.com/cover.jpg',
              },
            ]),
          ),
          { status: 200 },
        ),
      );

      const res = await app.request('/music/artists?name=Radiohead', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.results[0]!.title).toBe('Radiohead');
    });

    it('passes page and per_page options', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify(discogsSearchResponse([])),
          { status: 200 },
        ),
      );

      const res = await app.request(
        '/music/artists?name=Radiohead&page=2&per_page=5',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/music/artists?name=Radiohead', {}, env);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('GET /music/albums', () => {
    it('returns album search results', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify(
            discogsSearchResponse([
              {
                id: 1,
                type: 'master',
                title: 'Radiohead - OK Computer',
                uri: '',
                resource_url: '',
                thumb: '',
                cover_image: 'https://example.com/ok.jpg',
                year: '1997',
                genre: ['Electronic', 'Rock'],
                country: 'UK',
                barcode: ['123'],
                community: { want: 100, have: 200 },
              },
            ]),
          ),
          { status: 200 },
        ),
      );

      const res = await app.request('/music/albums?title=OK+Computer', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.results[0]!.artist).toBe('Radiohead');
    });

    it('passes artist, year, genre, page, and per_page options', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify(discogsSearchResponse([])),
          { status: 200 },
        ),
      );

      const res = await app.request(
        '/music/albums?title=OK+Computer&artist=Radiohead&year=1997&genre=Rock&page=1&per_page=10',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/music/albums?title=OK+Computer', {}, env);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('GET /music/tracks', () => {
    it('returns track search results', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify(
            discogsSearchResponse([
              {
                id: 1,
                type: 'release',
                title: 'Radiohead - Paranoid Android',
                uri: '',
                resource_url: '',
                thumb: '',
                year: '1997',
                genre: ['Rock'],
              },
            ]),
          ),
          { status: 200 },
        ),
      );

      const res = await app.request(
        '/music/tracks?track=Paranoid+Android',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.results[0]!.artist).toBe('Radiohead');
      expect(body.data.results[0]!.album).toBe('Paranoid Android');
    });

    it('passes artist, year, genre, page, and per_page options', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify(discogsSearchResponse([])),
          { status: 200 },
        ),
      );

      const res = await app.request(
        '/music/tracks?track=Paranoid+Android&artist=Radiohead&year=1997&genre=Rock&page=1&per_page=10',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request(
        '/music/tracks?track=Paranoid+Android',
        {},
        env,
      );
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });
});
