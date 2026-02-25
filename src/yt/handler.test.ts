import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const env = {
  TMDB_KEY: '',
  TWITCH_CLIENT_ID: '',
  TWITCH_CLIENT_SECRET: '',
  DISCOGS_TOKEN: '',
  GITHUB_TOKEN: '',
  YOUTUBE_KEY: 'test-key',
};

beforeEach(() => {
  mockFetch.mockReset();
});

const youtubeResponse = {
  kind: 'youtube#videoListResponse',
  etag: '',
  items: [
    {
      kind: 'youtube#video',
      etag: '',
      id: 'dQw4w9WgXcQ',
      snippet: {
        publishedAt: '2009-10-25T06:57:33Z',
        channelId: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw',
        title: 'Rick Astley - Never Gonna Give You Up',
        description: 'The official video for Rick Astley.',
        thumbnails: {
          default: {
            url: 'https://example.com/default.jpg',
            width: 120,
            height: 90,
          },
          high: {
            url: 'https://example.com/high.jpg',
            width: 480,
            height: 360,
          },
        },
        channelTitle: 'Rick Astley',
        categoryId: '10',
      },
    },
  ],
  pageInfo: { totalResults: 1, resultsPerPage: 1 },
};

const emptyResponse = {
  kind: 'youtube#videoListResponse',
  etag: '',
  items: [],
  pageInfo: { totalResults: 0, resultsPerPage: 0 },
};

describe('YouTube handler', () => {
  describe('GET /yt/video', () => {
    it('returns video data for a full youtube.com URL', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(youtubeResponse), { status: 200 }),
      );

      const res = await app.request(
        '/yt/video?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Rick Astley - Never Gonna Give You Up');
      expect(body.data.creator).toBe('Rick Astley');
      expect(body.data.url).toBe('https://youtu.be/dQw4w9WgXcQ');
    });

    it('returns video data for a youtu.be short URL', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(youtubeResponse), { status: 200 }),
      );

      const res = await app.request(
        '/yt/video?url=https://youtu.be/dQw4w9WgXcQ',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Rick Astley - Never Gonna Give You Up');
    });

    it('returns video data for URL with extra query params', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(youtubeResponse), { status: 200 }),
      );

      const res = await app.request(
        '/yt/video?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
        {},
        env,
      );
      expect(res.status).toBe(200);
    });

    it('returns video data for a raw video ID', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(youtubeResponse), { status: 200 }),
      );

      const res = await app.request(
        '/yt/video?url=dQw4w9WgXcQ',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 404 when no video is found', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(emptyResponse), { status: 200 }),
      );

      const res = await app.request('/yt/video?url=invalid-id', {}, env);
      expect(res.status).toBe(404);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request(
        '/yt/video?url=https://youtu.be/dQw4w9WgXcQ',
        {},
        env,
      );
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('uses highest resolution thumbnail available', async () => {
      const maxresResponse = {
        ...youtubeResponse,
        items: [
          {
            ...youtubeResponse.items[0],
            snippet: {
              ...youtubeResponse.items[0]!.snippet,
              thumbnails: {
                default: {
                  url: 'https://example.com/default.jpg',
                  width: 120,
                  height: 90,
                },
                medium: {
                  url: 'https://example.com/medium.jpg',
                  width: 320,
                  height: 180,
                },
                high: {
                  url: 'https://example.com/high.jpg',
                  width: 480,
                  height: 360,
                },
                maxres: {
                  url: 'https://example.com/maxres.jpg',
                  width: 1280,
                  height: 720,
                },
              },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(maxresResponse), { status: 200 }),
      );

      const res = await app.request(
        '/yt/video?url=dQw4w9WgXcQ',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.thumbnailUrl).toBe('https://example.com/maxres.jpg');
    });

    it('falls back through thumbnail sizes', async () => {
      const defaultOnly = {
        ...youtubeResponse,
        items: [
          {
            ...youtubeResponse.items[0],
            snippet: {
              ...youtubeResponse.items[0]!.snippet,
              thumbnails: {
                default: {
                  url: 'https://example.com/default.jpg',
                  width: 120,
                  height: 90,
                },
              },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(defaultOnly), { status: 200 }),
      );

      const res = await app.request(
        '/yt/video?url=dQw4w9WgXcQ',
        {},
        env,
      );
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.thumbnailUrl).toBe('https://example.com/default.jpg');
    });
  });
});
