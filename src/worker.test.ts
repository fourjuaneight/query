import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

beforeEach(() => {
  mockFetch.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  env = {
    TMDB_KEY: 'tmdb',
    TWITCH_CLIENT_ID: 'twitch-id',
    TWITCH_CLIENT_SECRET: 'twitch-secret',
    DISCOGS_TOKEN: 'discogs',
    GH_TOKEN: 'gh',
    YOUTUBE_KEY: 'yt',
    API_KEY: PASSWORD,
    PUBLIC_URL: ORIGIN,
    OAUTH_KV: createKV(),
  };
});

describe('Worker entry', () => {
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

  it('answers /mcp without a token with an OAuth challenge', async () => {
    const res = await request('/mcp', { method: 'POST' });

    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('resource_metadata=');
  });

  it('publishes protected resource and authorization server metadata', async () => {
    const resource = await request('/.well-known/oauth-protected-resource/mcp');
    expect(resource.status).toBe(200);
    expect(await resource.json()).toMatchObject({
      resource: `${ORIGIN}/mcp`,
      authorization_servers: [ORIGIN],
    });

    const server = await request('/.well-known/oauth-authorization-server');
    expect(server.status).toBe(200);
    expect(await server.json()).toMatchObject({
      authorization_endpoint: `${ORIGIN}/authorize`,
      token_endpoint: `${ORIGIN}/oauth/token`,
      registration_endpoint: `${ORIGIN}/oauth/register`,
    });
  });

  it('refuses /authorize when API_KEY is not set', async () => {
    delete env.API_KEY;

    const res = await request('/authorize');
    expect(res.status).toBe(503);
  });

  it('signs in with the owner password and serves MCP tools', async () => {
    // 1. Dynamic client registration
    const registered = await request('/oauth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Test Client',
        redirect_uris: [REDIRECT_URI],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      }),
    });
    expect(registered.status).toBe(201);
    const { client_id: clientId } = await registered.json<{
      client_id: string;
    }>();

    // 2. Authorization request with PKCE shows the consent page
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
    });
    const page = await request(`/authorize?${query}`);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('Test Client');
    expect(html).toContain('This sends access to an app on your computer');
    const handle = /name="handle" value="([^"]+)"/.exec(html)?.[1] ?? '';
    const cookie = cookiesOf(page);

    const decide = (password: string): Promise<Response> =>
      request(`/authorize?${query}`, {
        method: 'POST',
        headers: {
          Cookie: cookie,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ handle, password, decision: 'approve' }),
      });

    // 3. A wrong password is refused; the right one redirects with a code
    expect((await decide('wrong')).status).toBe(401);

    const approved = await decide(PASSWORD);
    expect(approved.status).toBe(302);
    const location = new URL(approved.headers.get('Location') ?? '');
    expect(`${location.origin}${location.pathname}`).toBe(REDIRECT_URI);
    expect(location.searchParams.get('state')).toBe('xyz');
    const code = location.searchParams.get('code') ?? '';

    // 4. Token exchange
    const token = await request('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        code_verifier: verifier,
        resource: `${ORIGIN}/mcp`,
      }),
    });
    expect(token.status).toBe(200);
    const { access_token: accessToken } = await token.json<{
      access_token: string;
    }>();

    // 5. A real MCP client lists and calls tools with the token
    const transport = new StreamableHTTPClientTransport(
      new URL(`${ORIGIN}/mcp`),
      {
        fetch: send,
        requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
      },
    );
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(transport);

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
});
