import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { AppEnv } from './typings';

type Ctx = Context<AppEnv>;

interface IntRange {
  min?: number;
  max?: number;
}

const badRequest = (message: string): HTTPException =>
  new HTTPException(400, { message });

const parseInteger = (
  raw: string,
  { min = 1, max = Number.MAX_SAFE_INTEGER }: IntRange,
): number | null => {
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
};

/**
 * Read an optional query param, treating blank values as missing.
 */
export const optionalQuery = (ctx: Ctx, name: string): string | undefined =>
  ctx.req.query(name)?.trim() || undefined;

/**
 * Read a required query param or throw a 400.
 */
export const requireQuery = (ctx: Ctx, name: string): string => {
  const value = optionalQuery(ctx, name);
  if (!value) {
    throw badRequest(`Missing required query parameter: ${name}`);
  }
  return value;
};

/**
 * Read an optional integer query param within a range or throw a 400.
 */
export const intQuery = (
  ctx: Ctx,
  name: string,
  range: IntRange = {},
): number | undefined => {
  const raw = optionalQuery(ctx, name);
  if (raw === undefined) return undefined;

  const value = parseInteger(raw, range);
  if (value === null) {
    const { min = 1, max } = range;
    throw badRequest(
      `Invalid query parameter: ${name} (expected an integer${max === undefined ? ` >= ${min}` : ` from ${min} to ${max}`})`,
    );
  }
  return value;
};

/**
 * Read an optional query param restricted to a set of values or throw a 400.
 */
export const enumQuery = <T extends string>(
  ctx: Ctx,
  name: string,
  allowed: readonly T[],
): T | undefined => {
  const raw = optionalQuery(ctx, name);
  if (raw === undefined) return undefined;

  if (!(allowed as readonly string[]).includes(raw)) {
    throw badRequest(
      `Invalid query parameter: ${name} (expected one of ${allowed.join(', ')})`,
    );
  }
  return raw as T;
};

/**
 * Read an optional boolean query param ("true"/"false"/"1"/"0") or throw a 400.
 */
export const boolQuery = (ctx: Ctx, name: string): boolean | undefined => {
  const raw = optionalQuery(ctx, name);
  if (raw === undefined) return undefined;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  throw badRequest(`Invalid query parameter: ${name} (expected true or false)`);
};

/**
 * Read a positive integer path param or throw a 400.
 */
export const idParam = (ctx: Ctx, label: string): number => {
  const value = parseInteger(ctx.req.param('id') ?? '', {});
  if (value === null) {
    throw badRequest(`Invalid ${label} ID`);
  }
  return value;
};
