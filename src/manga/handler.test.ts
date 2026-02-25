import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const mangaSearchResponse = {
  result: 'ok',
  response: 'collection',
  data: [
    {
      id: 'abc-123',
      type: 'manga',
      attributes: {
        title: { en: 'Naruto' },
        description: { en: 'A ninja story' },
        status: 'completed',
        year: 1999,
      },
      relationships: [
        {
          id: 'author-1',
          type: 'author',
          attributes: { name: 'Masashi Kishimoto' },
        },
        {
          id: 'cover-1',
          type: 'cover_art',
          attributes: { fileName: 'cover.jpg' },
        },
      ],
    },
  ],
  limit: 10,
  offset: 0,
  total: 1,
};

const mangaDetailResponse = {
  result: 'ok',
  response: 'entity',
  data: {
    id: 'abc-123',
    type: 'manga',
    attributes: {
      title: { en: 'Naruto' },
      description: { en: 'A ninja story' },
      status: 'completed',
      year: 1999,
    },
    relationships: [
      {
        id: 'author-1',
        type: 'author',
      },
      {
        id: 'cover-1',
        type: 'cover_art',
        attributes: { fileName: 'cover.jpg' },
      },
    ],
  },
};

const authorResponse = {
  result: 'ok',
  response: 'entity',
  data: {
    id: 'author-1',
    type: 'author',
    attributes: { name: 'Masashi Kishimoto' },
  },
};

describe('Manga handlers', () => {
  describe('GET /manga/search', () => {
    it('returns manga search results', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mangaSearchResponse), { status: 200 }),
      );

      const res = await app.request('/manga/search?title=Naruto');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data[0]!.title).toBe('Naruto');
      expect(body.data[0]!.author).toBe('Masashi Kishimoto');
      expect(body.data[0]!.cover).toContain('cover.jpg');
    });

    it('passes limit and offset options', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(mangaSearchResponse), { status: 200 }),
      );

      const res = await app.request(
        '/manga/search?title=Naruto&limit=5&offset=10',
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/manga/search?title=Naruto');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles manga with no cover art', async () => {
      const noCover = {
        ...mangaSearchResponse,
        data: [
          {
            id: 'abc-123',
            type: 'manga',
            attributes: {
              title: { en: 'No Cover Manga' },
              description: { en: '' },
              status: 'ongoing',
              year: 2020,
            },
            relationships: [
              {
                id: 'author-1',
                type: 'author',
                attributes: { name: 'Author' },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(noCover), { status: 200 }),
      );

      const res = await app.request('/manga/search?title=NoCover');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.cover).toBeNull();
    });

    it('handles manga title with no English key', async () => {
      const jpTitle = {
        ...mangaSearchResponse,
        data: [
          {
            id: 'abc-456',
            type: 'manga',
            attributes: {
              title: { ja: 'ナルト' },
              description: {},
              status: 'completed',
              year: 1999,
            },
            relationships: [],
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(jpTitle), { status: 200 }),
      );

      const res = await app.request('/manga/search?title=Naruto');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.title).toBe('ナルト');
    });
  });

  describe('GET /manga/:id', () => {
    it('returns manga details', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mangaDetailResponse), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(authorResponse), { status: 200 }),
        );

      const res = await app.request('/manga/abc-123');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Naruto');
      expect(body.data.author).toBe('Masashi Kishimoto');
      expect(body.data.url).toContain('abc-123');
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/manga/abc-123');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('returns 500 when manga has no relationships', async () => {
      const noRel = {
        result: 'ok',
        response: 'entity',
        data: {
          id: 'abc-123',
          type: 'manga',
          attributes: {
            title: { en: 'Naruto' },
            description: { en: 'A ninja story' },
            status: 'completed',
            year: 1999,
          },
          relationships: [],
        },
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(noRel), { status: 200 }),
      );

      const res = await app.request('/manga/abc-123');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });
});
