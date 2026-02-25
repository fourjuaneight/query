import { describe, it, expect, vi, beforeEach } from 'vitest';

import app from '../app';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

const searchResults = [
  {
    id: 'base1-4',
    localId: '4',
    name: 'Charizard',
    image: 'https://example.com/charizard.png',
  },
];

const cardDetails = {
  id: 'base1-4',
  localId: '4',
  name: 'Charizard',
  image: 'https://example.com/charizard.png',
  category: 'Pokemon',
  illustrator: 'Mitsuhiro Arita',
  rarity: 'Rare Holo',
  set: {
    id: 'base1',
    name: 'Base Set',
    cardCount: { official: 102, total: 102 },
  },
  variants: {
    firstEdition: true,
    holo: true,
    normal: false,
    reverse: false,
    wPromo: false,
  },
  updated: '2023-01-01',
  hp: 120,
  types: ['Fire'],
  evolveFrom: 'Charmeleon',
  stage: 'Stage2',
  attacks: [
    {
      cost: ['Fire', 'Fire', 'Fire', 'Fire'],
      name: 'Fire Spin',
      damage: 100,
    },
  ],
  weaknesses: [{ type: 'Water', value: '×2' }],
  retreat: 3,
};

describe('PKM handler', () => {
  describe('GET /pkm/cards', () => {
    it('returns Pokémon card data', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResults), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(cardDetails), { status: 200 }),
        );

      const res = await app.request('/pkm/cards?name=Charizard');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data[0]!.name).toBe('Charizard');
      expect(body.data[0]!.category).toBe('Pokemon');
      expect(body.data[0]!.hp).toBe(120);
      expect(body.data[0]!.types).toEqual(['Fire']);
      expect(body.data[0]!.evolveFrom).toBe('Charmeleon');
    });

    it('passes set filter', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResults), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(cardDetails), { status: 200 }),
        );

      const res = await app.request('/pkm/cards?name=Charizard&set=base1');
      expect(res.status).toBe(200);
    });

    it('returns empty array when no cards found', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      const res = await app.request('/pkm/cards?name=nonexistent');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns 500 when API call fails', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Server Error', { status: 500, statusText: 'Internal' }),
      );

      const res = await app.request('/pkm/cards?name=Charizard');
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('handles card with minimal optional fields', async () => {
      const minimalCard = {
        id: 'base1-1',
        localId: '1',
        name: 'Energy',
        image: '',
        category: 'Energy',
        set: {
          id: 'base1',
          name: 'Base Set',
          cardCount: { official: 102, total: 102 },
        },
        variants: {
          firstEdition: false,
          holo: false,
          normal: true,
          reverse: false,
          wPromo: false,
        },
        updated: '2023-01-01',
      };

      mockFetch
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              { id: 'base1-1', localId: '1', name: 'Energy', image: '' },
            ]),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(minimalCard), { status: 200 }),
        );

      const res = await app.request('/pkm/cards?name=Energy');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.hp).toBeNull();
      expect(body.data[0]!.types).toBeNull();
      expect(body.data[0]!.stage).toBeNull();
      expect(body.data[0]!.evolveFrom).toBeNull();
      expect(body.data[0]!.attacks).toBeNull();
      expect(body.data[0]!.weaknesses).toBeNull();
      expect(body.data[0]!.retreat).toBeNull();
      expect(body.data[0]!.rarity).toBeNull();
      expect(body.data[0]!.description).toBeNull();
      expect(body.data[0]!.illustrator).toBeNull();
    });

    it('handles card with description as effect', async () => {
      const effectCard = {
        ...cardDetails,
        description: undefined,
        effect: 'This card does something special.',
      };

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify(searchResults), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(effectCard), { status: 200 }),
        );

      const res = await app.request('/pkm/cards?name=Charizard');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data[0]!.description).toBe(
        'This card does something special.',
      );
    });
  });
});
