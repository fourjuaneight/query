/* eslint-disable id-length */
import type {
  MTGItem,
  RequestQuery,
  ScryfallError,
  ScryfallSearch,
} from './typings.d';
import { parseJSON } from '../common/helpers';

const magicColors: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

const escapeText = (text: string): string => text.replace(/\n/g, '\\n');

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
  try {
    const encodedName = encodeURIComponent(queryTerm.name);

    // Build query string with optional set and number filters
    let query = encodedName;
    if (queryTerm.set) {
      query += `+s:${queryTerm.set}`;
    }
    if (queryTerm.number) {
      query += `+cn:${queryTerm.number}`;
    }

    const request = await fetch(
      `https://api.scryfall.com/cards/search?order=set&q=${query}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (request.status !== 200) {
      throw new Error(
        `(fetch): ${request.status} - ${request.statusText} | ${queryTerm.set}/${queryTerm.number}`,
      );
    }

    const response = await parseJSON<ScryfallSearch | ScryfallError>(request);

    if (response.object === 'error') {
      const { details, warnings } = response as ScryfallError;
      const errMsg = warnings ? warnings.join(' - ') : details;

      throw new Error(`(request): ${errMsg}`);
    }

    const cards = (response as ScryfallSearch).data.map(
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
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[getMTGCard] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[getMTGCard] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};
