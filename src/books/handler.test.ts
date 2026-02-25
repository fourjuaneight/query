import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const openLibraryResponse = {
  records: {
    '/books/OL1234M': {
      isbns: ['9780451524935'],
      issns: [],
      lccns: [],
      oclcs: [],
      olids: [],
      publishDates: [],
      recordURL: '',
      data: {
        url: '',
        key: '/books/OL1234M',
        title: '1984',
        authors: [{ url: '', name: 'George Orwell' }],
        number_of_pages: 328,
        identifiers: {
          isbn_13: ['9780451524935'],
          isbn_10: ['0451524934'],
        },
        publishers: [{ name: 'Signet Classic' }],
        publish_date: '1961',
        subjects: [{ name: 'Dystopian', url: '' }],
      },
      details: {
        bib_key: '',
        info_url: '',
        preview: '',
        preview_url: '',
        details: { type: { key: '' }, title: '1984' },
      },
    },
  },
  items: [],
};

const searchResponse = {
  numFound: 1,
  start: 0,
  numFoundExact: true,
  num_found: 1,
  documentation_url: '',
  // eslint-disable-next-line id-length
  q: '1984',
  offset: null,
  docs: [
    {
      title: '1984',
      author_name: ['George Orwell'],
      first_publish_year: 1949,
      publisher: ['Signet Classic'],
      number_of_pages_median: 328,
      isbn: ['9780451524935', '0451524934'],
      subject: ['Fiction'],
    },
  ],
};

describe('Books handlers', () => {
  describe('GET /books/isbn', () => {
    it('returns book data for a valid ISBN', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(openLibraryResponse), { status: 200 }),
      );

      const res = await app.request('/books/isbn?isbn=9780451524935');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('1984');
      expect(body.data.authors).toEqual(['George Orwell']);
      expect(body.data.isbn13).toBe('9780451524935');
      expect(body.data.isbn10).toBe('0451524934');
      expect(body.data.coverUrl).toContain('9780451524935');
    });

    it('returns 404 when no book is found', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ records: {}, items: [] }), {
          status: 200,
        }),
      );

      const res = await app.request('/books/isbn?isbn=0000000000');
      expect(res.status).toBe(404);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/books/isbn?isbn=9780451524935');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles book with no subtitle or subjects', async () => {
      const minimal = {
        records: {
          '/books/OL1234M': {
            ...openLibraryResponse.records['/books/OL1234M'],
            data: {
              url: '',
              key: '/books/OL1234M',
              title: 'Minimal Book',
              identifiers: {
                isbn_13: [],
                isbn_10: [],
              },
              publish_date: 'August 2009',
            },
            details: {
              bib_key: '',
              info_url: '',
              preview: '',
              preview_url: '',
              details: { type: { key: '' }, title: 'Minimal Book' },
            },
          },
        },
        items: [],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(minimal), { status: 200 }),
      );

      const res = await app.request('/books/isbn?isbn=0000000000');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.title).toBe('Minimal Book');
      expect(body.data.subtitle).toBeNull();
      expect(body.data.authors).toEqual([]);
      expect(body.data.publishers).toEqual([]);
      expect(body.data.genre).toEqual([]);
      expect(body.data.isbn13).toBeNull();
      expect(body.data.isbn10).toBeNull();
      expect(body.data.coverUrl).toBeNull();
      expect(body.data.firstPublishYear).toBe(2009);
    });
  });

  describe('GET /books/search', () => {
    it('returns search results', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(searchResponse), { status: 200 }),
      );

      const res = await app.request('/books/search?title=1984');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]!.title).toBe('1984');
      expect(body.data[0]!.isbn13).toBe('9780451524935');
      expect(body.data[0]!.isbn10).toBe('0451524934');
    });

    it('passes limit, page, and language options', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(searchResponse), { status: 200 }),
      );

      const res = await app.request(
        '/books/search?title=1984&limit=5&page=2&language=eng',
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/books/search?title=1984');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles search doc with cover_i and minimal fields', async () => {
      const minimalSearch = {
        ...searchResponse,
        docs: [
          {
            title: 'Minimal',
            cover_i: 12345,
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(minimalSearch), { status: 200 }),
      );

      const res = await app.request('/books/search?title=Minimal');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.title).toBe('Minimal');
      expect(body.data[0]!.authors).toEqual([]);
      expect(body.data[0]!.coverUrl).toContain('12345');
      expect(body.data[0]!.isbn10).toBeNull();
      expect(body.data[0]!.isbn13).toBeNull();
    });
  });
});
