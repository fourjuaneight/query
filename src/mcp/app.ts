import { createMcpHandler } from '@modelcontextprotocol/server';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { logger } from 'hono/logger';

import type { AppEnv } from '../common/typings';
import { errorResponse } from '../common/helpers';
import { isCurrentKey } from '../auth/owner';
import { createMcpServer } from './server';

const jsonRpcError = (code: number, message: string): object => ({
  jsonrpc: '2.0',
  error: { code, message },
  id: null,
});

/**
 * Reject tokens whose grant was approved with an older API_KEY.
 * OAuthProvider passes the grant's props on the execution context.
 */
const requireCurrentKey = createMiddleware<AppEnv>(async (ctx, next) => {
  if (await isCurrentKey(ctx.executionCtx.props, ctx.env.API_KEY)) {
    return next();
  }
  const description = 'The API key changed. Sign in again.';
  return ctx.json(
    { error: 'invalid_token', error_description: description },
    401,
    {
      'WWW-Authenticate': `Bearer error="invalid_token", error_description="${description}"`,
    },
  );
});

/**
 * The MCP endpoint. OAuthProvider only routes requests here after it has
 * validated the access token and rate-limited the request (src/worker.ts).
 */
const mcpApp = new Hono<AppEnv>({ strict: false });

mcpApp.use('*', logger(), requireCurrentKey);

mcpApp.all('/mcp', async ctx => {
  // JSON-RPC batching was removed in MCP 2025-06-18. One batch would run many
  // tool calls for one rate-limited request.
  if (ctx.req.method === 'POST') {
    const body: unknown = await ctx.req.raw
      .clone()
      .json()
      .catch(() => null);
    if (Array.isArray(body)) {
      return ctx.json(
        jsonRpcError(-32600, 'JSON-RPC batches are not supported'),
        400,
      );
    }
  }

  const handler = createMcpHandler(() => createMcpServer(ctx.env), {
    onerror: err => console.error(`[mcp] ${err.message}`),
  });
  return handler.fetch(ctx.req.raw);
});

mcpApp.notFound(ctx => ctx.json(jsonRpcError(-32601, 'Not Found'), 404));

mcpApp.onError(errorResponse);

export default mcpApp;
