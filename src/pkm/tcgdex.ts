import type {
  PKMItem,
  RequestQuery,
  TCGdexCard,
  TCGdexCardBrief,
} from './typings.d';

const API = 'https://api.tcgdex.net/v2/en';

/**
 * Fetch card search results by name
 * DOCS: https://tcgdex.dev/rest/cards
 */
const searchCards = async (
  name: string,
  set?: string,
): Promise<TCGdexCardBrief[]> => {
  try {
    const url = new URL(`${API}/cards`);
    url.searchParams.set('name', name);

    if (set) {
      url.searchParams.set('set.id', set);
    }

    const request = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (request.status !== 200) {
      const errorResp = await request.text();
      throw `(fetch): ${request.status} - ${request.statusText} (${name}) - ${errorResp}`;
    }

    return (await request.json()) as TCGdexCardBrief[];
  } catch (error) {
    console.error(`(searchCards) - ${error}`);
    throw `(searchCards) - ${error}`;
  }
};

/**
 * Fetch full card details by ID
 * DOCS: https://tcgdex.dev/rest/card
 */
const getCardDetails = async (id: string): Promise<TCGdexCard> => {
  try {
    const request = await fetch(`${API}/cards/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (request.status !== 200) {
      const errorResp = await request.text();
      throw `(fetch): ${request.status} - ${request.statusText} (${id}) - ${errorResp}`;
    }

    return (await request.json()) as TCGdexCard;
  } catch (error) {
    console.error(`(getCardDetails) - ${error}`);
    throw `(getCardDetails) - ${error}`;
  }
};

/**
 * Search TCGdex database for Pokémon TCG cards matching the given search query
 *
 * @param queryTerm - Search data (set is optional)
 * @returns Array of matching Pokémon TCG cards with details
 */
export const getPKMCard = async (
  queryTerm: RequestQuery,
): Promise<PKMItem[]> => {
  try {
    const results = await searchCards(queryTerm.name, queryTerm.set);

    if (results.length === 0) {
      return [];
    }

    const cards = await Promise.all(
      results.map(async (brief): Promise<PKMItem> => {
        const card = await getCardDetails(brief.id);

        return {
          name: card.name,
          category: card.category,
          hp: card.hp ?? null,
          types: card.types ?? null,
          stage: card.stage ?? null,
          evolveFrom: card.evolveFrom ?? null,
          attacks: card.attacks ?? null,
          weaknesses: card.weaknesses ?? null,
          retreat: card.retreat ?? null,
          rarity: card.rarity ?? null,
          set: card.set.id,
          set_name: card.set.name,
          description: card.description ?? card.effect ?? null,
          illustrator: card.illustrator ?? null,
          image: card.image ?? brief.image ?? '',
        };
      }),
    );

    return cards;
  } catch (error) {
    console.error(`[getPKMCard] - ${error}`);
    throw `[getPKMCard] - ${error}`;
  }
};
