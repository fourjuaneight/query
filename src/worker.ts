import {
  GrantType,
  OAuthError,
  OAuthProvider,
} from '@cloudflare/workers-oauth-provider';

import type { Bindings } from './common/typings';
import app from './app';
import { MCP_SCOPE, isCurrentKey } from './auth/owner';
import { withinRateLimit } from './common/middleware';
import mcpApp from './mcp/app';

const providers = new Map<string, OAuthProvider<Bindings>>();

/**
 * One OAuth provider per origin the Worker is reached on (workers.dev, a
 * custom domain, localhost), so each one advertises its own /mcp resource.
 * Tokens stay bound to the origin that issued them.
 */
const getProvider = (origin: string): OAuthProvider<Bindings> => {
  let provider = providers.get(origin);
  if (provider) return provider;

  provider = new OAuthProvider<Bindings>({
    apiRoute: '/mcp',
    apiHandler: mcpApp,
    defaultHandler: app,
    authorizeEndpoint: '/authorize',
    tokenEndpoint: '/oauth/token',
    // DCR for older clients; CIMD is the 2026-07-28 default
    clientRegistrationEndpoint: '/oauth/register',
    clientIdMetadataDocumentEnabled: true,
    scopesSupported: [MCP_SCOPE],
    requiredScopes: [MCP_SCOPE],
    resourceMetadata: {
      resource: `${origin}/mcp`,
      authorization_servers: [origin],
    },
    // A grant lives while it is used and expires after 30 idle days
    refreshTokenIdleTTL: 30 * 24 * 60 * 60,
    // Changing API_KEY revokes grants approved with the old key
    tokenExchangeCallback: async ({ grantType, props, env }) => {
      if (
        grantType === GrantType.REFRESH_TOKEN &&
        !(await isCurrentKey(props, env.API_KEY))
      ) {
        throw new OAuthError('invalid_grant', {
          description: 'The API key changed. Sign in again.',
        });
      }
    },
  });
  providers.set(origin, provider);
  return provider;
};

/** Paths owned by the OAuth provider or the MCP endpoint. */
const isMcpPath = (path: string): boolean =>
  path === '/mcp' ||
  path.startsWith('/mcp/') ||
  path === '/authorize' ||
  path.startsWith('/oauth/') ||
  path.startsWith('/.well-known/oauth-');

/** Provider-handled paths that never reach the REST app's rate limiter. */
const needsRateLimit = (path: string): boolean =>
  path === '/mcp' || path.startsWith('/mcp/') || path.startsWith('/oauth/');

// REST API, MCP endpoint and OAuth endpoints in one Worker
export default {
  fetch: async (request, env, ctx) => {
    const { origin, pathname } = new URL(request.url);

    // MCP sign-in needs the API_KEY password; without it, serve REST only
    if (!env.API_KEY) {
      if (isMcpPath(pathname)) {
        return Response.json(
          { success: false, error: 'MCP sign-in is not configured' },
          { status: 503 },
        );
      }
      return app.fetch(request, env, ctx);
    }

    if (needsRateLimit(pathname) && !(await withinRateLimit(env, request))) {
      return Response.json(
        { success: false, error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    return getProvider(origin).fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Bindings>;
