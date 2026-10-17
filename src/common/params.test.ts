import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';

import type { ApiBody } from './test-types';
import type { AppEnv } from './typings';
import { errorResponse } from './helpers';
import {
  boolQuery,
  enumQuery,
  idParam,
  intQuery,
  optionalQuery,
  requireQuery,
} from './params';

const app = new Hono<AppEnv>();
app.get('/required', ctx => ctx.json({ value: requireQuery(ctx, 'q') }));
app.get('/optional', ctx =>
  ctx.json({ value: optionalQuery(ctx, 'q') ?? null }),
);
app.get('/int', ctx =>
  ctx.json({ value: intQuery(ctx, 'n', { min: 1, max: 10 }) ?? null }),
);
app.get('/enum', ctx =>
  ctx.json({ value: enumQuery(ctx, 'e', ['asc', 'desc']) ?? null }),
);
app.get('/bool', ctx => ctx.json({ value: boolQuery(ctx, 'b') ?? null }));
app.get('/id/:id', ctx => ctx.json({ value: idParam(ctx, 'thing') }));
app.onError(errorResponse);

const get = async (
  path: string,
): Promise<{ status: number; body: ApiBody & { value?: unknown } }> => {
  const res = await app.request(path);
  return { status: res.status, body: await res.json() };
};

describe('query param helpers', () => {
  it('requireQuery trims and rejects blank values', async () => {
    expect((await get('/required?q=%20hi%20')).body.value).toBe('hi');

    const blank = await get('/required?q=%20%20');
    expect(blank.status).toBe(400);
    expect(blank.body.error).toBe('Missing required query parameter: q');
  });

  it('optionalQuery treats blank as missing', async () => {
    expect((await get('/optional?q=')).body.value).toBeNull();
  });

  it.each([
    ['/int?n=5', 200, 5],
    ['/int', 200, null],
    ['/int?n=0', 400, undefined],
    ['/int?n=11', 400, undefined],
    ['/int?n=abc', 400, undefined],
    ['/int?n=5abc', 400, undefined],
    ['/int?n=2.5', 400, undefined],
  ])('intQuery %s → %i', async (path, status, value) => {
    const res = await get(path);
    expect(res.status).toBe(status);
    expect(res.body.value).toBe(value);
  });

  it('enumQuery accepts allowed values only', async () => {
    expect((await get('/enum?e=asc')).body.value).toBe('asc');
    expect((await get('/enum?e=sideways')).status).toBe(400);
  });

  it('boolQuery parses true/false/1/0', async () => {
    expect((await get('/bool?b=true')).body.value).toBe(true);
    expect((await get('/bool?b=0')).body.value).toBe(false);
    expect((await get('/bool?b=maybe')).status).toBe(400);
  });

  it('idParam requires a positive integer', async () => {
    expect((await get('/id/42')).body.value).toBe(42);

    const invalid = await get('/id/42abc');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('Invalid thing ID');
  });
});
