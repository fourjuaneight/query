import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { Bindings } from './common/typings';
import worker from './worker';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const ORIGIN = 'https://query.test';
const REDIRECT_URI = 'http://localhost:3000/callback';
const PASSWORD = 'owner-secret';

/** In-memory stand-in for the OAUTH_KV namespace. */
const createKV = (): KVNamespace => {
  const store = new Map<string, string>();
  const kv = {
    get: (key: string, options?: unknown) => {
      const value = store.get(key) ?? null;
      const type =
        typeof options === 'string'
          ? options
          : (options as { type?: string } | undefined)?.type;
      return Promise.resolve(
        value !== null && type === 'json'
          ? (JSON.parse(value) as unknown)
          : value,
      );
    },
    put: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    delete: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
    list: ({ prefix = '' }: { prefix?: string } = {}) =>
      Promise.resolve({
        keys: [...store.keys()]
          .filter(name => name.startsWith(prefix))
          .map(name => ({ name })),
        list_complete: true,
        cacheStatus: null,
      }),
  };
  return kv as unknown as KVNamespace;
};

const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
  props: {},
} as unknown as ExecutionContext;

let env: Bindings;

type WorkerRequest = Parameters<typeof worker.fetch>[0];

/** Send a request through the Worker entry, like the Workers runtime does. */
const send = (input: string | URL, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(input, init) as WorkerRequest, env, ctx);

const request = (path: string, init?: RequestInit): Promise<Response> =>
  send(`${ORIGIN}${path}`, init);

const form = (fields: Record<string, string>): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(fields),
});

const base64url = (bytes: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Collect Set-Cookie headers into a Cookie header value. */
const cookiesOf = (res: Response): string =>
  res.headers
    .getSetCookie()
    .map(cookie => cookie.split(';')[0])
    .join('; ');

// ── OAuth flow helpers ─────────────────────────────────────────────────────

const registerClient = async (): Promise<string> => {
  const res = await request('/oauth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Test <b>Client</b>',
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    }),
  });
  expect(res.status).toBe(201);
  const { client_id: clientId } = await res.json<{ client_id: string }>();
  return clientId;
};

interface Consent {
  clientId: string;
  verifier: string;
  query: URLSearchParams;
  page: Response;
  html: string;
  handle: string;
  cookie: string;
}

/** Register a client and open the consent page with a PKCE request. */
const openConsent = async (
  params: Record<string, string> = {},
  clientId?: string,
): Promise<Consent> => {
  clientId ??= await registerClient();
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
  );
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: 'xyz',
    scope: 'mcp:read',
    resource: `${ORIGIN}/mcp`,
    ...params,
  });
  const page = await request(`/authorize?${query}`);
  const html = await page.text();
  const handle = /name="handle" value="([^"]+)"/.exec(html)?.[1] ?? '';
  return {
    clientId,
    verifier,
    query,
    page,
    html,
    handle,
    cookie: cookiesOf(page),
  };
};

/** Submit the consent form. */
const decide = (
  consent: Consent,
  fields: Record<string, string>,
  cookie = consent.cookie,
): Promise<Response> => {
  const init = form({ handle: consent.handle, ...fields });
  return request(`/authorize?${consent.query}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), Cookie: cookie },
  });
};

const exchangeCode = (consent: Consent, code: string): Promise<Response> =>
  request(
    '/oauth/token',
    form({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: consent.clientId,
      code_verifier: consent.verifier,
      resource: `${ORIGIN}/mcp`,
    }),
  );

interface Tokens {
  clientId: string;
  accessToken: string;
  refreshToken: string;
}

/** Run the whole sign-in: register, consent with the password, exchange the code. */
const signIn = async (clientId?: string): Promise<Tokens> => {
  const consent = await openConsent({}, clientId);
  const approved = await decide(consent, {
    password: PASSWORD,
    decision: 'approve',
  });
  const code = new URL(approved.headers.get('Location') ?? '').searchParams.get(
    'code',
  );
  const token = await exchangeCode(consent, code ?? '');
  const body = await token.json<{
    access_token: string;
    refresh_token: string;
  }>();
  return {
    clientId: consent.clientId,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
  };
};

const refresh = (tokens: Tokens): Promise<Response> =>
  request(
    '/oauth/token',
    form({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: tokens.clientId,
    }),
  );

/** Connect a real MCP client to the Worker with an access token. */
const connect = async (
  accessToken: string,
  { path = '/mcp', pin }: { path?: string; pin?: string } = {},
): Promise<Client> => {
  const transport = new StreamableHTTPClientTransport(
    new URL(`${ORIGIN}${path}`),
    {
      fetch: send,
      requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
  const client = new Client(
    { name: 'test', version: '1.0.0' },
    pin ? { versionNegotiation: { mode: { pin } } } : {},
  );
  await client.connect(transport);
  return client;
};

/** POST raw JSON-RPC to /mcp with a token. */
const postMcp = (accessToken: string, body: unknown): Promise<Response> =>
  request('/mcp', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  mockFetch.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  env = {
    TMDB_KEY: 'tmdb',
    TWITCH_CLIENT_ID: 'twitch-id',
    TWITCH_CLIENT_SECRET: 'twitch-secret',
    DISCOGS_TOKEN: 'discogs',
    GH_TOKEN: 'gh',
    YOUTUBE_KEY: 'yt',
    API_KEY: PASSWORD,
    OAUTH_KV: createKV(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Worker entry: REST', () => {
  it('keeps the REST API on the API_KEY bearer header', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ numFound: 0, docs: [] })),
    );

    const denied = await request('/books/search?title=1984');
    expect(denied.status).toBe(401);

    const allowed = await request('/books/search?title=1984', {
      headers: { Authorization: `Bearer ${PASSWORD}` },
    });
    expect(allowed.status).toBe(200);
  });

  it('serves REST without API_KEY and turns MCP off', async () => {
    delete env.API_KEY;
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ numFound: 0, docs: [] })),
    );

    expect((await request('/')).status).toBe(200);
    expect((await request('/books/search?title=1984')).status).toBe(200);

    for (const path of [
      '/mcp',
      '/authorize',
      '/oauth/register',
      '/oauth/token',
      '/.well-known/oauth-authorization-server',
    ]) {
      const res = await request(path, { method: 'POST' });
      expect(res.status, path).toBe(503);
    }
  });
});

describe('Worker entry: OAuth discovery', () => {
  it('answers /mcp without a token with an OAuth challenge', async () => {
    const res = await request('/mcp', { method: 'POST' });

    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('resource_metadata=');
  });

  it('refuses the REST API_KEY as an MCP token', async () => {
    const res = await request('/mcp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PASSWORD}` },
    });

    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('invalid_token');
  });

  it('publishes protected resource and authorization server metadata', async () => {
    const resource = await request('/.well-known/oauth-protected-resource/mcp');
    expect(resource.status).toBe(200);
    expect(await resource.json()).toMatchObject({
      resource: `${ORIGIN}/mcp`,
      authorization_servers: [ORIGIN],
      scopes_supported: ['mcp:read'],
    });

    const server = await request('/.well-known/oauth-authorization-server');
    expect(server.status).toBe(200);
    expect(await server.json()).toMatchObject({
      issuer: ORIGIN,
      authorization_endpoint: `${ORIGIN}/authorize`,
      token_endpoint: `${ORIGIN}/oauth/token`,
      registration_endpoint: `${ORIGIN}/oauth/register`,
    });
  });

  it('names the resource after the origin each request arrives on', async () => {
    const res = await send(
      'https://other.test/.well-known/oauth-protected-resource/mcp',
    );

    expect(await res.json()).toMatchObject({
      resource: 'https://other.test/mcp',
      authorization_servers: ['https://other.test'],
    });
  });

  it('rate-limits OAuth endpoints and /mcp before the provider', async () => {
    env.RATE_LIMITER = {
      limit: () => Promise.resolve({ success: false }),
    };

    for (const path of ['/oauth/register', '/oauth/token', '/mcp']) {
      const res = await request(path, { method: 'POST' });
      expect(res.status, path).toBe(429);
      expect(res.headers.get('Retry-After'), path).toBe('60');
    }
  });
});

describe('Worker entry: consent page', () => {
  it('shows the client and the fixed scope, escaping client text', async () => {
    const consent = await openConsent();

    expect(consent.page.status).toBe(200);
    expect(consent.page.headers.get('Cache-Control')).toBe('no-store');
    expect(consent.html).toContain('Test &#60;b&#62;Client&#60;/b&#62;');
    expect(consent.html).not.toContain('<b>Client</b>');
    expect(consent.html).toContain('(mcp:read)');
    expect(consent.html).toContain(
      'This sends access to an app on your computer',
    );
  });

  it('redirects with access_denied when the owner denies', async () => {
    const consent = await openConsent();

    const res = await decide(consent, { decision: 'deny' });

    expect(res.status).toBe(302);
    const location = new URL(res.headers.get('Location') ?? '');
    expect(`${location.origin}${location.pathname}`).toBe(REDIRECT_URI);
    expect(location.searchParams.get('error')).toBe('access_denied');
    expect(location.searchParams.get('state')).toBe('xyz');
  });

  it.each(['', 'wrong'])('refuses the password %j', async password => {
    const consent = await openConsent();

    const res = await decide(consent, { password, decision: 'approve' });

    expect(res.status).toBe(401);
    expect(await res.text()).toContain('Wrong password');
  });

  it('refuses a form without the consent cookie or a valid handle', async () => {
    const consent = await openConsent();
    const fields = { password: PASSWORD, decision: 'approve' };

    expect((await decide(consent, fields, '')).status).toBe(400);
    expect((await decide({ ...consent, handle: 'bogus' }, fields)).status).toBe(
      400,
    );
  });

  it('refuses a consent handle that was already used', async () => {
    const consent = await openConsent();
    const fields = { password: PASSWORD, decision: 'approve' };

    expect((await decide(consent, fields)).status).toBe(302);
    expect((await decide(consent, fields)).status).toBe(400);
  });

  it('refuses a POST that is not a form', async () => {
    const res = await request('/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    expect(res.status).toBe(400);
  });

  it('renders an unknown client locally instead of redirecting', async () => {
    const res = await request(
      `/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: 'unknown',
        redirect_uri: REDIRECT_URI,
      })}`,
    );

    expect(res.status).toBe(400);
    expect(res.headers.get('Location')).toBeNull();
    expect(await res.text()).toContain('Authorization failed');
  });

  it('redirects request errors to a known client', async () => {
    const clientId = await registerClient();

    // No PKCE challenge
    const res = await request(
      `/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        state: 'xyz',
      })}`,
    );

    expect(res.status).toBe(302);
    const location = new URL(res.headers.get('Location') ?? '');
    expect(location.searchParams.get('error')).toBeTruthy();
    expect(location.searchParams.get('state')).toBe('xyz');
  });
});

describe('Worker entry: Client ID Metadata Documents', () => {
  const CIMD_ORIGIN = 'https://cimd.test';

  beforeEach(() => {
    // The provider enables CIMD only with this compatibility flag
    vi.stubGlobal('Cloudflare', {
      compatibilityFlags: { global_fetch_strictly_public: true },
    });
  });

  afterEach(() => {
    delete (globalThis as { Cloudflare?: unknown }).Cloudflare;
  });

  it('advertises CIMD support', async () => {
    const res = await send(
      `${CIMD_ORIGIN}/.well-known/oauth-authorization-server`,
    );

    expect(await res.json()).toMatchObject({
      client_id_metadata_document_supported: true,
    });
  });

  it('shows an error page when the client metadata cannot be loaded', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));

    const res = await send(
      `${CIMD_ORIGIN}/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: 'https://client.example/oauth/metadata.json',
        redirect_uri: 'https://client.example/callback',
        code_challenge: 'x'.repeat(43),
        code_challenge_method: 'S256',
      })}`,
    );

    expect(res.status).toBe(502);
    expect(await res.text()).toContain('could not be verified');
  });
});

describe('Worker entry: MCP with OAuth', () => {
  it('issues read-only tokens with a refresh token', async () => {
    const consent = await openConsent({ scope: '' });
    const approved = await decide(consent, {
      password: PASSWORD,
      decision: 'approve',
    });
    expect(approved.status).toBe(302);
    const location = new URL(approved.headers.get('Location') ?? '');
    expect(location.searchParams.get('state')).toBe('xyz');
    expect(location.searchParams.get('iss')).toBe(ORIGIN);
    const code = location.searchParams.get('code') ?? '';

    const token = await exchangeCode(consent, code);
    expect(token.status).toBe(200);
    expect(await token.json()).toMatchObject({
      token_type: 'bearer',
      scope: 'mcp:read',
      refresh_token: expect.any(String),
    });

    // A code works once
    expect((await exchangeCode(consent, code)).status).toBe(400);
  });

  it.each([
    ['2025 (legacy)', undefined],
    ['2026-07-28', '2026-07-28'],
  ])('serves tools to a %s client', async (_label, pin) => {
    const { accessToken } = await signIn();
    const client = await connect(accessToken, { pin });

    if (pin) expect(client.getNegotiatedProtocolVersion()).toBe(pin);
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(21);

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ numFound: 1, docs: [{ title: '1984' }] })),
    );
    const result = await client.callTool({
      name: 'search_books',
      arguments: { title: '1984' },
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result.content)).toContain('1984');

    await client.close();
  });

  it('serves /mcp/ with a trailing slash', async () => {
    const { accessToken } = await signIn();
    const client = await connect(accessToken, { path: '/mcp/' });

    expect((await client.listTools()).tools).toHaveLength(21);
    await client.close();
  });

  it('answers unknown /mcp sub-paths with JSON', async () => {
    const { accessToken } = await signIn();

    const res = await request('/mcp/unknown', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ jsonrpc: '2.0' });
  });

  it('rejects JSON-RPC batches', async () => {
    const { accessToken } = await signIn();

    const res = await postMcp(accessToken, [
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    ]);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: -32600 } });
  });

  it('refreshes tokens', async () => {
    const tokens = await signIn();

    const res = await refresh(tokens);
    expect(res.status).toBe(200);
    const { access_token: accessToken } = await res.json<{
      access_token: string;
    }>();

    const client = await connect(accessToken);
    expect((await client.listTools()).tools).toHaveLength(21);
    await client.close();
  });

  it('signs out every client when API_KEY changes', async () => {
    const tokens = await signIn();
    env.API_KEY = 'new-secret';

    const res = await postMcp(tokens.accessToken, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('invalid_token');

    const refreshed = await refresh(tokens);
    expect(refreshed.status).toBe(400);
    expect(await refreshed.json()).toMatchObject({ error: 'invalid_grant' });
  });

  it('keeps earlier grants when the owner signs in again', async () => {
    // Same client and redirect URI, like a second account on one CIMD client
    const first = await signIn();
    await signIn(first.clientId);

    expect((await refresh(first)).status).toBe(200);
  });
});
