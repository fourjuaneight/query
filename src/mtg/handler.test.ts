import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const scryfallResponse = {
  object: 'list',
  has_more: false,
  total_cards: 1,
  data: [
    {
      name: 'Lightning Bolt',
      colors: ['R'],
      type_line: 'Instant',
      set: 'lea',
      set_name: 'Limited Edition Alpha',
      oracle_text: 'Lightning Bolt deals 3 damage to any target.',
      flavor_text: null,
      rarity: 'common',
      collector_number: '161',
      artist: 'Christopher Rush',
      released_at: '1993-08-05',
      image_uris: {
        png: 'https://example.com/bolt.png',
        large: '',
        normal: '',
        small: '',
        border_crop: '',
        art_crop: '',
      },
    },
  ],
};

describe('MTG handler', () => {
  describe('GET /mtg/cards', () => {
    it('returns card data for a valid name', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(scryfallResponse), { status: 200 }),
      );

      const res = await app.request('/mtg/cards?name=Lightning+Bolt');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data[0]!.name).toBe('Lightning Bolt');
      expect(body.data[0]!.colors).toEqual(['Red']);
      expect(body.data[0]!.oracle_text).toBe(
        'Lightning Bolt deals 3 damage to any target.',
      );
      expect(body.data[0]!.image).toBe('https://example.com/bolt.png');
    });

    it('passes set and number filters', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(scryfallResponse), { status: 200 }),
      );

      const res = await app.request(
        '/mtg/cards?name=Lightning+Bolt&set=lea&number=161',
      );
      expect(res.status).toBe(200);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/mtg/cards?name=Lightning+Bolt');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles Scryfall error response', async () => {
      const errorResponse = {
        object: 'error',
        code: 'not_found',
        status: 404,
        details: 'No cards found matching your query.',
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(errorResponse), { status: 200 }),
      );

      const res = await app.request('/mtg/cards?name=xyznonexistent');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles Scryfall error with warnings', async () => {
      const warningResponse = {
        object: 'error',
        code: 'bad_request',
        status: 400,
        warnings: ['Invalid set code', 'Check your input'],
        details: 'Bad request',
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(warningResponse), { status: 200 }),
      );

      const res = await app.request('/mtg/cards?name=test');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles card with card_faces (double-faced)', async () => {
      const doubleFaced = {
        object: 'list',
        has_more: false,
        total_cards: 1,
        data: [
          {
            name: 'Delver of Secrets // Insectile Aberration',
            colors: ['U'],
            type_line: 'Creature — Human Wizard // Creature — Human Insect',
            set: 'isd',
            set_name: 'Innistrad',
            oracle_text: null,
            flavor_text: null,
            rarity: 'common',
            collector_number: '51',
            artist: 'Matt Stewart',
            released_at: '2011-09-30',
            image_uris: null,
            card_faces: [
              {
                oracle_text: 'At the beginning of your upkeep...',
                flavor_text: 'He welcomed the whispers.',
                image_uris: {
                  png: 'https://example.com/front.png',
                },
              },
              {
                oracle_text: 'Flying',
                flavor_text: null,
                image_uris: {
                  png: 'https://example.com/back.png',
                },
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(doubleFaced), { status: 200 }),
      );

      const res = await app.request('/mtg/cards?name=Delver+of+Secrets');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.oracle_text).toContain('upkeep');
      expect(body.data[0]!.image).toBe('https://example.com/front.png');
      expect(body.data[0]!.back).toBe('https://example.com/back.png');
    });

    it('handles card with empty colors', async () => {
      const colorless = {
        ...scryfallResponse,
        data: [
          {
            ...scryfallResponse.data[0],
            colors: [],
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(colorless), { status: 200 }),
      );

      const res = await app.request('/mtg/cards?name=Sol+Ring');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.colors).toBeNull();
    });

    it('handles oracle_text with newlines', async () => {
      const newlineCard = {
        ...scryfallResponse,
        data: [
          {
            ...scryfallResponse.data[0],
            oracle_text: 'Line one\nLine two\nLine three',
            flavor_text: 'Flavor\nText',
          },
        ],
      };

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(newlineCard), { status: 200 }),
      );

      const res = await app.request('/mtg/cards?name=test');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.oracle_text).toBe('Line one\\nLine two\\nLine three');
      expect(body.data[0]!.flavor_text).toBe('Flavor\\nText');
    });
  });
});
