import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TMDB_KEY: 'test-key',
  TWITCH_CLIENT_ID: '',
  TWITCH_CLIENT_SECRET: '',
  DISCOGS_TOKEN: '',
  GH_TOKEN: '',
  YOUTUBE_KEY: '',
};

beforeEach(() => {
  mockFetch.mockReset();
});

const movieDetails = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  release_date: '1999-10-15',
  overview: 'An office worker forms an underground fight club.',
  runtime: 139,
  genres: [{ id: 18, name: 'Drama' }],
  poster_path: '/poster.jpg',
  backdrop_path: null,
  budget: 63000000,
  revenue: 101200000,
  status: 'Released',
  tagline: '',
  vote_average: 8.4,
  vote_count: 20000,
  credits: {
    cast: [],
    crew: [
      {
        id: 1,
        name: 'David Fincher',
        job: 'Director',
        department: 'Directing',
        profile_path: null,
      },
    ],
  },
};

const searchResponse = {
  page: 1,
  results: [{ id: 550, title: 'Fight Club' }],
  total_pages: 1,
  total_results: 1,
};

const emptySearchResponse = {
  page: 1,
  results: [],
  total_pages: 0,
  total_results: 0,
};

describe('Movies handlers', () => {
  describe('GET /movies/query', () => {
    it('returns movie data for a valid title', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(movieDetails), { status: 200 }),
        );

      const res = await app.request('/movies/query?title=Fight+Club', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Fight Club');
      expect(body.data.director).toBe('David Fincher');
      expect(body.data.posterUrl).toContain('/poster.jpg');
    });

    it('passes language and year options', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(movieDetails), { status: 200 }),
        );

      const res = await app.request(
        '/movies/query?title=Fight+Club&language=en-US&year=1999',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 404 when no movie is found', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(emptySearchResponse), { status: 200 }),
      );

      const res = await app.request(
        '/movies/query?title=nonexistentmovie',
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
        '/movies/query?title=Fight+Club',
        {},
        env,
      );
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('GET /movies/:id', () => {
    it('returns movie data for a numeric ID', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(movieDetails), { status: 200 }),
      );

      const res = await app.request('/movies/550', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Fight Club');
    });

    it('passes language option when provided', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(movieDetails), { status: 200 }),
      );

      const res = await app.request(
        '/movies/550?language=es-MX',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/movies/550', {}, env);
      expect(res.status).toBe(500);
    });
  });

  describe('GET /movies/search', () => {
    it('returns search results with pagination', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(movieDetails), { status: 200 }),
        );

      const res = await app.request(
        '/movies/search?query=fight+club',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.results).toHaveLength(1);
      expect(body.data.results[0]!.title).toBe('Fight Club');
      expect(body.data.totalResults).toBe(1);
    });

    it('passes language, year, and page options', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(movieDetails), { status: 200 }),
        );

      const res = await app.request(
        '/movies/search?query=fight&language=en-US&year=1999&page=1',
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
        '/movies/search?query=fight+club',
        {},
        env,
      );
      expect(res.status).toBe(500);
    });
  });

  describe('edge cases', () => {
    it('handles movie with no director', async () => {
      const noDirector = {
        ...movieDetails,
        credits: { cast: [], crew: [] },
      };

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(noDirector), { status: 200 }),
        );

      const res = await app.request('/movies/query?title=Fight+Club', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.director).toBeNull();
    });

    it('handles movie with no poster', async () => {
      const noPoster = { ...movieDetails, poster_path: null };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(noPoster), { status: 200 }),
      );

      const res = await app.request('/movies/550', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.posterUrl).toBeNull();
    });
  });
});
