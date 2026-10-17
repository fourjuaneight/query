import { OAuthProvider } from '@cloudflare/workers-oauth-provider';

import type { Bindings } from './common/typings';
import app from './app';
import mcpApp from './mcp/app';

let provider: OAuthProvider<Bindings> | undefined;

/**
 * Build the OAuth provider once per isolate. It needs PUBLIC_URL from the
 * environment to name the MCP resource, so it can't be built at import time.
 */
const getProvider = (env: Bindings): OAuthProvider<Bindings> => {
  if (provider) return provider;

  const origin = (env.PUBLIC_URL ?? '').replace(/\/+$/, '');
  if (!origin) throw new Error('PUBLIC_URL is not configured');

  provider = new OAuthProvider<Bindings>({
    apiRoute: '/mcp',
    apiHandler: mcpApp,
    defaultHandler: app,
    authorizeEndpoint: '/authorize',
    tokenEndpoint: '/oauth/token',
    // DCR for older clients; CIMD is the 2026-07-28 default
    clientRegistrationEndpoint: '/oauth/register',
    clientIdMetadataDocumentEnabled: true,
    scopesSupported: ['mcp:read'],
    requiredScopes: ['mcp:read'],
    resourceMetadata: {
      resource: `${origin}/mcp`,
      authorization_servers: [origin],
    },
  });
  return provider;
};

// REST API, MCP endpoint and OAuth endpoints in one Worker
export default {
  fetch: (request, env, ctx) => getProvider(env).fetch(request, env, ctx),
} satisfies ExportedHandler<Bindings>;
