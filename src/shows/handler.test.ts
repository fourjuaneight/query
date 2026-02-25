import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TMDB_KEY: 'test-key',
  TWITCH_CLIENT_ID: '',
  TWITCH_CLIENT_SECRET: '',
  DISCOGS_TOKEN: '',
  GITHUB_TOKEN: '',
  YOUTUBE_KEY: '',
};

beforeEach(() => {
  mockFetch.mockReset();
});

const showDetails = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  first_air_date: '2008-01-20',
  last_air_date: '2013-09-29',
  overview: 'A chemistry teacher diagnosed with terminal lung cancer.',
  number_of_seasons: 5,
  number_of_episodes: 62,
  episode_run_time: [45],
  genres: [{ id: 18, name: 'Drama' }],
  poster_path: '/poster.jpg',
  backdrop_path: null,
  status: 'Ended',
  tagline: '',
  type: 'Scripted',
  vote_average: 8.9,
  vote_count: 10000,
  created_by: [{ id: 1, name: 'Vince Gilligan', profile_path: null }],
  seasons: [],
};

const searchResponse = {
  page: 1,
  results: [{ id: 1396, name: 'Breaking Bad' }],
  total_pages: 1,
  total_results: 1,
};

const emptySearchResponse = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
};

describe('Shows handlers', () => {
  describe('GET /shows/query', () => {
    it('returns TV show data for a valid title', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(showDetails), { status: 200 }),
        );

      const res = await app.request('/shows/query?title=Breaking+Bad', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Breaking Bad');
      expect(body.data.creators).toEqual(['Vince Gilligan']);
      expect(body.data.seasonCount).toBe(5);
      expect(body.data.posterUrl).toContain('/poster.jpg');
    });

    it('passes language and year options', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(showDetails), { status: 200 }),
        );

      const res = await app.request(
        '/shows/query?title=Breaking+Bad&language=en-US&year=2008',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 404 when no show is found', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(emptySearchResponse), { status: 200 }),
      );

      const res = await app.request(
        '/shows/query?title=nonexistentshow',
        {},
        env,
      );
      expect(res.status).toBe(404);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request(
        '/shows/query?title=Breaking+Bad',
        {},
        env,
      );
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('GET /shows/:id', () => {
    it('returns show data for a numeric ID', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(showDetails), { status: 200 }),
      );

      const res = await app.request('/shows/1396', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Breaking Bad');
    });

    it('passes language option when provided', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(showDetails), { status: 200 }),
      );

      const res = await app.request('/shows/1396?language=es-MX', {}, env);
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/shows/1396', {}, env);
      expect(res.status).toBe(500);
    });
  });

  describe('GET /shows/search', () => {
    it('returns search results with pagination', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(showDetails), { status: 200 }),
        );

      const res = await app.request(
        '/shows/search?query=breaking+bad',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.results).toHaveLength(1);
      expect(body.data.results[0]!.title).toBe('Breaking Bad');
      expect(body.data.totalResults).toBe(1);
    });

    it('passes language, year, and page options', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(showDetails), { status: 200 }),
        );

      const res = await app.request(
        '/shows/search?query=breaking&language=en-US&year=2008&page=1',
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
        '/shows/search?query=breaking+bad',
        {},
        env,
      );
      expect(res.status).toBe(500);
    });
  });

  describe('edge cases', () => {
    it('handles show with no poster', async () => {
      const noPoster = { ...showDetails, poster_path: null };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(noPoster), { status: 200 }),
      );

      const res = await app.request('/shows/1396', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.posterUrl).toBeNull();
    });
  });
});
