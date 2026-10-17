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
});
