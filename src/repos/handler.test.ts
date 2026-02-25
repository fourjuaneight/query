import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TMDB_KEY: '',
  TWITCH_CLIENT_ID: '',
  TWITCH_CLIENT_SECRET: '',
  DISCOGS_TOKEN: '',
  GITHUB_TOKEN: 'test-token',
  YOUTUBE_KEY: '',
};

beforeEach(() => {
  mockFetch.mockReset();
});

const githubSearchResponse = {
  total_count: 1,
  incomplete_results: false,
  items: [
    {
      id: 1,
      name: 'linux',
      full_name: 'torvalds/linux',
      owner: { login: 'torvalds', html_url: 'https://github.com/torvalds' },
      html_url: 'https://github.com/torvalds/linux',
      description: 'Linux kernel source tree',
      language: 'C',
      created_at: '2011-09-04T22:48:12Z',
      license: {
        key: 'other',
        name: 'Other',
        spdx_id: 'NOASSERTION',
        url: null,
      },
    },
  ],
};

const emptySearchResponse = {
  total_count: 0,
  incomplete_results: false,
  items: [],
};

describe('Repos handlers', () => {
  describe('GET /repos/search', () => {
    it('returns repo search results', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(githubSearchResponse), { status: 200 }),
      );

      const res = await app.request('/repos/search?query=linux', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.results[0]!.name).toBe('linux');
      expect(body.data.results[0]!.fullName).toBe('torvalds/linux');
      expect(body.data.results[0]!.language).toBe('C');
    });

    it('passes language, sort, order, page, and per_page options', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(githubSearchResponse), { status: 200 }),
      );

      const res = await app.request(
        '/repos/search?query=linux&language=C&sort=stars&order=desc&page=1&per_page=10',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/repos/search?query=linux', {}, env);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('GET /repos/query', () => {
    it('returns the most relevant repo', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(githubSearchResponse), { status: 200 }),
      );

      const res = await app.request('/repos/query?name=linux', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('linux');
      expect(body.data.language).toBe('C');
    });

    it('returns 404 when no repo is found', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(emptySearchResponse), { status: 200 }),
      );

      const res = await app.request(
        '/repos/query?name=nonexistent-xyz-abc',
        {},
        env,
      );
      expect(res.status).toBe(404);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/repos/query?name=linux', {}, env);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles repo with no license or description', async () => {
      const noLicense = {
        total_count: 1,
        incomplete_results: false,
        items: [
          {
            ...githubSearchResponse.items[0],
            description: null,
            license: null,
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(noLicense), { status: 200 }),
      );

      const res = await app.request('/repos/query?name=linux', {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.description).toBeNull();
      expect(body.data.licenseName).toBeNull();
    });
  });
});
