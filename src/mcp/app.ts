import { createMcpHandler } from '@modelcontextprotocol/server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

import type { AppEnv } from '../common/typings';
import { errorResponse } from '../common/helpers';
import { rateLimit } from '../common/middleware';
import { createMcpServer } from './server';

/**
 * The MCP endpoint. OAuthProvider only routes requests here after it has
 * validated the access token.
 */
const mcpApp = new Hono<AppEnv>();

mcpApp.use('*', logger(), rateLimit);

mcpApp.all('/mcp', ctx =>
  createMcpHandler(() => createMcpServer(ctx.env)).fetch(ctx.req.raw),
);

mcpApp.onError(errorResponse);

export default mcpApp;
