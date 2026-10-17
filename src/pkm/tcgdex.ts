import type {
  PKMItem,
  RequestQuery,
  TCGdexCard,
  TCGdexCardBrief,
} from './typings.d';
import { buildUrl, upstreamFetch } from '../common/helpers';

const API = 'https://api.tcgdex.net/v2/en';

/** Default and maximum page size (each card costs one subrequest) */
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 40;

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
 * Search TCGdex database for Pokémon TCG cards matching the given search query.
 * Each match needs its own details request, so results are paginated to keep
 * the number of upstream subrequests bounded.
 *
 * @param queryTerm - Search data (set, limit, and page are optional)
 * @returns Array of matching Pokémon TCG cards with details
 */
export const getPKMCard = async (
  queryTerm: RequestQuery,
): Promise<PKMItem[]> => {
  const limit = queryTerm.limit ?? DEFAULT_LIMIT;
  const start = ((queryTerm.page ?? 1) - 1) * limit;

  const results = await searchCards(queryTerm.name, queryTerm.set);

  return Promise.all(
    results.slice(start, start + limit).map(async (brief): Promise<PKMItem> => {
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
