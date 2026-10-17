import { describe, it, expect } from 'vitest';

import type { ApiBody } from './common/test-types';

import app from './app';

describe('App routing', () => {
  // ── Health check ──────────────────────────────────────────────────────────

  it('GET / returns health-check text', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Why are you here?');
  });

  // ── 404 handler ───────────────────────────────────────────────────────────

  it('returns 404 JSON for unknown routes', async () => {
    const res = await app.request('/nonexistent');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ success: false, error: 'Not Found' });
  });

  // ── Missing query params return 400 ───────────────────────────────────────

  const missingParamCases: [string, string][] = [
    ['/books/isbn', 'isbn'],
    ['/books/search', 'title'],
    ['/games/search', 'query'],
    ['/games/query', 'title'],
    ['/manga/search', 'title'],
    ['/movies/query', 'title'],
    ['/movies/search', 'query'],
    ['/mtg/cards', 'name'],
    ['/music/artists', 'name'],
    ['/music/albums', 'title'],
    ['/music/tracks', 'track'],
    ['/pkm/cards', 'name'],
    ['/repos/search', 'query'],
    ['/repos/query', 'name'],
    ['/shows/query', 'title'],
    ['/shows/search', 'query'],
    ['/yt/video', 'url'],
  ];

  it.each(missingParamCases)(
    '%s returns 400 when required param "%s" is missing',
    async (path, param) => {
      const res = await app.request(path);
      expect(res.status).toBe(400);

      const body = await res.json<ApiBody>();
      expect(body.success).toBe(false);
      expect(body.error).toContain(param);
    },
  );

  // ── Invalid ID params ─────────────────────────────────────────────────────

  it('GET /games/abc returns 400 for non-numeric ID', async () => {
    const res = await app.request('/games/abc');
    expect(res.status).toBe(400);

    const body = await res.json<ApiBody>();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid');
  });

  it('GET /movies/abc returns 400 for non-numeric ID', async () => {
    const res = await app.request('/movies/abc');
    expect(res.status).toBe(400);

    const body = await res.json<ApiBody>();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid');
  });

  it('GET /shows/abc returns 400 for non-numeric ID', async () => {
    const res = await app.request('/shows/abc');
    expect(res.status).toBe(400);

    const body = await res.json<ApiBody>();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid');
  });
});

describe('Auth', () => {
  const env = { API_KEY: 'secret' };

  it('is disabled when API_KEY is not set', async () => {
    const res = await app.request('/books/isbn', {}, {});
    expect(res.status).toBe(400);
  });

  it('rejects requests without a bearer token', async () => {
    const res = await app.request('/books/isbn', {}, env);
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('Bearer');
    expect(await res.json()).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('rejects requests with the wrong token', async () => {
    const res = await app.request(
      '/books/isbn',
      { headers: { Authorization: 'Bearer nope' } },
      env,
    );
    expect(res.status).toBe(401);
  });

  it('accepts requests with the right token', async () => {
    const res = await app.request(
      '/books/isbn',
      { headers: { Authorization: 'Bearer secret' } },
      env,
    );
    // Passes auth, then fails validation for the missing param
    expect(res.status).toBe(400);
  });

  it('leaves the health check public', async () => {
    const res = await app.request('/', {}, env);
    expect(res.status).toBe(200);
  });
});
