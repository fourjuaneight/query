import type {
  PKMItem,
  RequestQuery,
  TCGdexCard,
  TCGdexCardBrief,
} from './typings.d';
import { buildUrl, upstreamFetch } from '../common/helpers';

const API = 'https://api.tcgdex.net/v2/en';

/**
 * Fetch card search results by name
 * DOCS: https://tcgdex.dev/rest/cards
 */
const searchCards = async (
  name: string,
  set?: string,
): Promise<TCGdexCardBrief[]> =>
  upstreamFetch<TCGdexCardBrief[]>(
    'TCGdex',
    buildUrl(`${API}/cards`, { name, 'set.id': set }),
  );

/**
 * Fetch full card details by ID
 * DOCS: https://tcgdex.dev/rest/card
 */
const getCardDetails = async (id: string): Promise<TCGdexCard> =>
  upstreamFetch<TCGdexCard>('TCGdex', `${API}/cards/${encodeURIComponent(id)}`);

/**
 * Search TCGdex database for Pokémon TCG cards matching the given search query
 *
 * @param queryTerm - Search data (set is optional)
 * @returns Array of matching Pokémon TCG cards with details
 */
export const getPKMCard = async (
  queryTerm: RequestQuery,
): Promise<PKMItem[]> => {
  const results = await searchCards(queryTerm.name, queryTerm.set);

  return Promise.all(
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
};
