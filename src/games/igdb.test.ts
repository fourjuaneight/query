import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = { TWITCH_CLIENT_ID: 'id', TWITCH_CLIENT_SECRET: 'secret' };

const tokenResponse = (token: string): Response =>
  new Response(
    JSON.stringify({
      access_token: token,
      expires_in: 3600,
      token_type: 'bearer',
    }),
    { status: 200 },
  );

// Fresh module per test so the in-memory token cache starts empty
const loadIgdb = async (): Promise<typeof import('./igdb')> => {
  vi.resetModules();
  return import('./igdb');
};

const authHeader = (call: unknown[]): string =>
  (call[1] as { headers: Record<string, string> }).headers['Authorization']!;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('IGDB client', () => {
  it('escapes quotes and backslashes in search queries', async () => {
    const { searchGames } = await loadIgdb();
    mockFetch
      .mockResolvedValueOnce(tokenResponse('t1'))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));

    await searchGames(env, 'a"; where id = 1; \\');

    const body = (mockFetch.mock.calls[1]![1] as RequestInit).body as string;
    expect(body).toContain('search "a\\"; where id = 1; \\\\";');
  });

  it('shares one token request across concurrent cold calls', async () => {
    const { searchGames } = await loadIgdb();
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes('twitch.tv')
          ? tokenResponse('t1')
          : new Response('[]', { status: 200 }),
      ),
    );

    await Promise.all([
      searchGames(env, 'a'),
      searchGames(env, 'b'),
      searchGames(env, 'c'),
    ]);

    const tokenCalls = mockFetch.mock.calls.filter(([url]) =>
      (url as string).includes('twitch.tv'),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it('refreshes the token and retries once on 401', async () => {
    const { searchGames } = await loadIgdb();
    mockFetch
      .mockResolvedValueOnce(tokenResponse('stale'))
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      .mockResolvedValueOnce(tokenResponse('fresh'))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));

    await expect(searchGames(env, 'a')).resolves.toEqual([]);

    expect(authHeader(mockFetch.mock.calls[1]!)).toBe('Bearer stale');
    expect(authHeader(mockFetch.mock.calls[3]!)).toBe('Bearer fresh');
  });

  it('gives up after a second 401', async () => {
    const { searchGames } = await loadIgdb();
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes('twitch.tv')
          ? tokenResponse('t')
          : new Response('Unauthorized', { status: 401 }),
      ),
    );

    await expect(searchGames(env, 'a')).rejects.toThrow('[IGDB] 401');
  });
});
