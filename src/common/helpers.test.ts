import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  buildPosterUrl,
  tmdbFetch,
  parseJSON,
  jsonSuccess,
  jsonError,
} from './helpers';
import { TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './constants';

// ── buildPosterUrl ──────────────────────────────────────────────────────────

describe('buildPosterUrl', () => {
  it('returns full URL when a poster path is provided', () => {
    expect(buildPosterUrl('/abc123.jpg')).toBe(
      `${TMDB_IMAGE_BASE_URL}/abc123.jpg`,
    );
  });

  it('returns null when poster path is null', () => {
    expect(buildPosterUrl(null)).toBeNull();
  });

  it('returns null when poster path is empty string', () => {
    expect(buildPosterUrl('')).toBeNull();
  });
});

// ── parseJSON ───────────────────────────────────────────────────────────────

describe('parseJSON', () => {
  it('parses a JSON response into the expected type', async () => {
    const body = { key: 'value', count: 42 };
    const response = new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await parseJSON<{ key: string; count: number }>(response);
    expect(result).toEqual(body);
  });
});

// ── tmdbFetch ───────────────────────────────────────────────────────────────

describe('tmdbFetch', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('builds correct URL with api_key and params', async () => {
    const payload = { id: 1, title: 'Test' };
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    const result = await tmdbFetch<{ id: number; title: string }>(
      'test-key',
      '/movie/1',
      { language: 'en-US' },
    );

    expect(result).toEqual(payload);

    const calledUrl = new URL(mockFetch.mock.calls[0]![0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      `${TMDB_BASE_URL}/movie/1`,
    );
    expect(calledUrl.searchParams.get('api_key')).toBe('test-key');
    expect(calledUrl.searchParams.get('language')).toBe('en-US');
  });

  it('throws on non-200 response', async () => {
    mockFetch.mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    );

    await expect(tmdbFetch('key', '/bad')).rejects.toThrow('[tmdbFetch]');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    await expect(tmdbFetch('key', '/fail')).rejects.toThrow('Network error');
  });
});

// ── jsonSuccess / jsonError ─────────────────────────────────────────────────

describe('jsonSuccess', () => {
  it('returns { success: true, data } with status 200', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/test', ctx => jsonSuccess(ctx, { hello: 'world' }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ success: true, data: { hello: 'world' } });
  });
});

describe('jsonError', () => {
  it('returns { success: false, error } with default 400 status', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/test', ctx => jsonError(ctx, 'bad request'));

    const res = await app.request('/test');
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'bad request' });
  });

  it('returns custom status code', async () => {
    const { Hono } = await import('hono');
    const app = new Hono();

    app.get('/test', ctx => jsonError(ctx, 'not found', 404));

    const res = await app.request('/test');
    expect(res.status).toBe(404);
  });
});
