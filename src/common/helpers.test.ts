import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ApiBody } from './test-types';
import type { AppEnv } from './typings';

import { HTTPException } from 'hono/http-exception';

import {
  UpstreamError,
  buildPosterUrl,
  buildUrl,
  errorResponse,
  tmdbFetch,
  parseJSON,
  jsonSuccess,
  jsonError,
  upstreamFetch,
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

    await expect(tmdbFetch('key', '/bad')).rejects.toThrow('[TMDB] 404');
  });

  it('never includes the API key in error messages', async () => {
    mockFetch.mockResolvedValue(
      new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }),
    );

    const error = await tmdbFetch('secret-key', '/movie/1').catch(
      (err: unknown) => err,
    );
    expect(error).toBeInstanceOf(UpstreamError);
    expect((error as UpstreamError).status).toBe(401);
    expect((error as UpstreamError).message).not.toContain('secret-key');
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
    const app = new Hono<AppEnv>();

    app.get('/test', ctx => jsonSuccess(ctx, { hello: 'world' }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);

    const body = await res.json<ApiBody>();
    expect(body).toEqual({ success: true, data: { hello: 'world' } });
  });
});

describe('jsonError', () => {
  it('returns { success: false, error } with default 400 status', async () => {
    const { Hono } = await import('hono');
    const app = new Hono<AppEnv>();

    app.get('/test', ctx => jsonError(ctx, 'bad request'));

    const res = await app.request('/test');
    expect(res.status).toBe(400);

    const body = await res.json<ApiBody>();
    expect(body).toEqual({ success: false, error: 'bad request' });
  });

  it('returns custom status code', async () => {
    const { Hono } = await import('hono');
    const app = new Hono<AppEnv>();

    app.get('/test', ctx => jsonError(ctx, 'not found', 404));

    const res = await app.request('/test');
    expect(res.status).toBe(404);
  });
});

// ── buildUrl ────────────────────────────────────────────────────────────────

describe('buildUrl', () => {
  it('sets defined params and skips undefined ones', () => {
    const url = buildUrl('https://example.com/search', {
      query: 'a b',
      page: 2,
      lang: undefined,
    });

    expect(url.searchParams.get('query')).toBe('a b');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.has('lang')).toBe(false);
  });
});

// ── upstreamFetch ───────────────────────────────────────────────────────────

describe('upstreamFetch', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('accepts any 2xx status', async () => {
    mockFetch.mockResolvedValue(new Response('{"ok":1}', { status: 201 }));

    await expect(
      upstreamFetch('Test', 'https://example.com/x'),
    ).resolves.toEqual({ ok: 1 });
  });

  it('throws UpstreamError with status 0 on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    const error = await upstreamFetch('Test', 'https://example.com/x').catch(
      (err: unknown) => err,
    );
    expect(error).toBeInstanceOf(UpstreamError);
    expect((error as UpstreamError).status).toBe(0);
  });
});

// ── errorResponse ───────────────────────────────────────────────────────────

describe('errorResponse', () => {
  const run = async (
    error: Error,
  ): Promise<{ status: number; body: ApiBody }> => {
    const { Hono } = await import('hono');
    const app = new Hono<AppEnv>();
    app.get('/test', () => {
      throw error;
    });
    app.onError(errorResponse);

    const res = await app.request('/test');
    return { status: res.status, body: await res.json<ApiBody>() };
  };

  it.each([
    [404, 404, 'Svc: not found'],
    [429, 429, 'Svc: rate limit exceeded'],
    [500, 502, 'Svc: upstream request failed'],
    [401, 502, 'Svc: upstream request failed'],
    [0, 502, 'Svc: upstream request failed'],
  ])(
    'maps upstream %i to %i without leaking details',
    async (upstream, expected, message) => {
      const { status, body } = await run(
        new UpstreamError('Svc', upstream, 'secret upstream body'),
      );
      expect(status).toBe(expected);
      expect(body).toEqual({ success: false, error: message });
    },
  );

  it('uses the status and message of an HTTPException', async () => {
    const { status, body } = await run(
      new HTTPException(400, { message: 'bad input' }),
    );
    expect(status).toBe(400);
    expect(body).toEqual({ success: false, error: 'bad input' });
  });

  it('returns a generic 500 for unexpected errors', async () => {
    const { status, body } = await run(new Error('boom: internal detail'));
    expect(status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Internal Server Error' });
  });
});
