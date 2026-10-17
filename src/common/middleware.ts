import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { AppEnv, Bindings } from './typings';

/**
 * Check the per-IP rate limit for a request.
 * Always passes when the RATE_LIMITER binding is absent.
 */
export const withinRateLimit = async (
  env: Bindings | undefined,
  request: Request,
): Promise<boolean> => {
  const limiter = env?.RATE_LIMITER;
  if (!limiter) return true;

  const key = request.headers.get('cf-connecting-ip') ?? 'anonymous';
  const { success } = await limiter.limit({ key });
  return success;
};

// Rate limit: enforced only when the RATE_LIMITER binding exists
export const rateLimit = createMiddleware<AppEnv>(async (ctx, next) => {
  if (!(await withinRateLimit(ctx.env, ctx.req.raw))) {
    throw new HTTPException(429, { message: 'Too Many Requests' });
  }
  return next();
});
