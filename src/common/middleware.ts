import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { AppEnv } from './typings';

// Rate limit: enforced only when the RATE_LIMITER binding exists
export const rateLimit = createMiddleware<AppEnv>(async (ctx, next) => {
  const limiter = ctx.env?.RATE_LIMITER;
  if (!limiter) return next();

  const key = ctx.req.header('cf-connecting-ip') ?? 'anonymous';
  const { success } = await limiter.limit({ key });
  if (!success) {
    throw new HTTPException(429, { message: 'Too Many Requests' });
  }
  return next();
});
