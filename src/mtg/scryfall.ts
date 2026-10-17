/* eslint-disable id-length */
import type {
  MTGItem,
  RequestQuery,
  ScryfallError,
  ScryfallSearch,
} from './typings.d';
import { buildUrl, upstreamFetch } from '../common/helpers';

const SCRYFALL_SEARCH_URL = 'https://api.scryfall.com/cards/search';

const magicColors: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

const escapeText = (text: string): string => text.replace(/\n/g, '\\n');

/**
 * Type guard to check if a Scryfall response is an error
 */
const isScryfallError = (
  response: ScryfallSearch | ScryfallError,
): response is ScryfallError => response.object === 'error';

/**
 * Search Scryfall database for cards matching the given search pattern.
 * DOCS: https://scryfall.com/docs/api/cards/search
 * REF: https://scryfall.com/docs/syntax
 *
 * @param queryTerm search data (set and number are optional)
 * @returns Array of MTG items matching the search criteria, with details like name, type, oracle text, etc.
 */
export const getMTGCard = async (
  queryTerm: RequestQuery,
): Promise<MTGItem[]> => {
  // Scryfall search syntax: set and collector number are optional filters
  const query = [
    queryTerm.name,
    queryTerm.set && `s:${queryTerm.set}`,
    queryTerm.number && `cn:${queryTerm.number}`,
  ]
    .filter(Boolean)
    .join(' ');

  const url = buildUrl(SCRYFALL_SEARCH_URL, { order: 'set', q: query });

  // Scryfall requires an explicit User-Agent and Accept header
  const response = await upstreamFetch<ScryfallSearch | ScryfallError>(
    'Scryfall',
    url,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'QueryAPI/1.0',
      },
    },
  );

  if (isScryfallError(response)) {
    const errMsg = response.warnings
      ? response.warnings.join(' - ')
      : response.details;

    throw new Error(`(request): ${errMsg}`);
  }

  const cards = response.data.map(
    ({
      artist,
      card_faces,
      collector_number,
      colors,
      flavor_text,
      image_uris,
      name,
      oracle_text,
      rarity,
      released_at,
      set_name,
      set,
      type_line,
    }) => {
      const oText = oracle_text
        ? escapeText(oracle_text)
        : card_faces?.[0]?.oracle_text
          ? escapeText(card_faces?.[0]?.oracle_text)
          : null;
      const fText = flavor_text
        ? escapeText(flavor_text)
        : card_faces?.[0]?.flavor_text
          ? escapeText(card_faces?.[0]?.flavor_text)
          : null;
      const item: MTGItem = {
        name,
        colors:
          colors?.length !== 0
            ? (colors
                ?.map(color => magicColors[color])
                .filter((c): c is string => c !== undefined) ?? null)
            : null,
        type: type_line,
        set: set.toUpperCase(),
        set_name,
        oracle_text: oText,
        flavor_text: fText,
        rarity,
        collector_number: parseInt(collector_number, 10),
        artist,
        released_at,
        image: image_uris?.png ?? card_faces?.[0]?.image_uris?.png ?? '',
        back: card_faces?.[1]?.image_uris?.png ?? null,
      };

      return item;
    },
  );

  return cards;
};
