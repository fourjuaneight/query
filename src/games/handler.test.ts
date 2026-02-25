import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TWITCH_CLIENT_ID: 'test-id',
  TWITCH_CLIENT_SECRET: 'test-secret',
  TMDB_KEY: '',
  DISCOGS_TOKEN: '',
  GITHUB_TOKEN: '',
  YOUTUBE_KEY: '',
};

const twitchTokenResponse = {
  access_token: 'test-token',
  expires_in: 3600,
  token_type: 'bearer',
};

const igdbGameResult = [
  {
    id: 1942,
    name: 'The Witcher 3: Wild Hunt',
    summary: 'An epic RPG',
    cover: { id: 1, image_id: 'co1234', url: '' },
    genres: [{ id: 12, name: 'Role-playing (RPG)' }],
    platforms: [{ id: 6, name: 'PC (Microsoft Windows)' }],
    involved_companies: [
      {
        id: 1,
        company: { id: 1, name: 'CD Projekt Red' },
        developer: true,
        publisher: false,
      },
      {
        id: 2,
        company: { id: 2, name: 'CD Projekt' },
        developer: false,
        publisher: true,
      },
    ],
    first_release_date: 1431993600,
    rating: 92.5,
  },
];

/**
 * Helper that configures mockFetch based on the URL being fetched.
 * IGDB uses a cached OAuth token, so we can't rely on sequential
 * mockResolvedValueOnce calls.
 */
const setupMocks = (igdbResponse: unknown[], igdbStatus = 200): void => {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('twitch.tv')) {
      return Promise.resolve(
        new Response(JSON.stringify(twitchTokenResponse), { status: 200 }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify(igdbResponse), { status: igdbStatus }),
    );
  });
};

const setupErrorMock = (): void => {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('twitch.tv')) {
      return Promise.resolve(
        new Response('Unauthorized', {
          status: 401,
          statusText: 'Unauthorized',
        }),
      );
    }
    return Promise.resolve(
      new Response('Server Error', {
        status: 500,
        statusText: 'Internal',
      }),
    );
  });
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Games handlers', () => {
  describe('GET /games/search', () => {
    it('returns game search results', async () => {
      setupMocks(igdbGameResult);

      const res = await app.request('/games/search?query=witcher', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data[0]!.title).toBe('The Witcher 3: Wild Hunt');
      expect(body.data[0]!.developers).toEqual(['CD Projekt Red']);
      expect(body.data[0]!.publishers).toEqual(['CD Projekt']);
      expect(body.data[0]!.coverUrl).toContain('co1234');
      expect(body.data[0]!.rating).toBe(93);
    });

    it('passes limit option when provided', async () => {
      setupMocks(igdbGameResult);

      const res = await app.request(
        '/games/search?query=witcher&limit=5',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      setupErrorMock();

      const res = await app.request('/games/search?query=witcher', {}, env);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('GET /games/query', () => {
    it('returns the first game result for a title', async () => {
      setupMocks(igdbGameResult);

      const res = await app.request('/games/query?title=witcher', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('The Witcher 3: Wild Hunt');
    });

    it('returns 404 when no game is found', async () => {
      setupMocks([]);

      const res = await app.request(
        '/games/query?title=nonexistent',
        {},
        env,
      );
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('No game found');
    });

    it('returns 500 when API call fails', async () => {
      setupErrorMock();

      const res = await app.request('/games/query?title=witcher', {}, env);
      expect(res.status).toBe(500);
    });
  });

  describe('GET /games/:id', () => {
    it('returns 400 for non-numeric ID', async () => {
      const res = await app.request('/games/abc');
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('Invalid');
    });

    it('returns game data for a valid numeric ID', async () => {
      setupMocks(igdbGameResult);

      const res = await app.request('/games/1942', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('The Witcher 3: Wild Hunt');
    });

    it('returns 404 when game ID is not found', async () => {
      setupMocks([]);

      const res = await app.request('/games/99999', {}, env);
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('No game found');
    });

    it('returns 500 when API call fails', async () => {
      setupErrorMock();

      const res = await app.request('/games/1942', {}, env);
      expect(res.status).toBe(500);
    });
  });

  describe('normalizeGameData edge cases', () => {
    it('handles game with no optional fields', async () => {
      const minimalGame = [{ id: 100, name: 'Minimal Game' }];
      setupMocks(minimalGame);

      const res = await app.request('/games/search?query=minimal', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.title).toBe('Minimal Game');
      expect(body.data[0]!.summary).toBeNull();
      expect(body.data[0]!.releaseDate).toBeNull();
      expect(body.data[0]!.genres).toEqual([]);
      expect(body.data[0]!.platforms).toEqual([]);
      expect(body.data[0]!.developers).toEqual([]);
      expect(body.data[0]!.publishers).toEqual([]);
      expect(body.data[0]!.coverUrl).toBeNull();
      expect(body.data[0]!.rating).toBeNull();
    });
  });
});
