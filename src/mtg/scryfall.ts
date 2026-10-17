/* eslint-disable id-length */
import { HTTPException } from 'hono/http-exception';

import type {
  MTGItem,
  RequestQuery,
  ScryfallError,
  ScryfallSearch,
} from './typings.d';
import { UpstreamError, buildUrl, upstreamFetch } from '../common/helpers';

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
 * Extract the human-readable message from a Scryfall error body
 * DOCS: https://scryfall.com/docs/api/errors
 */
const scryfallDetails = (body: string): string => {
  try {
    const error = JSON.parse(body) as ScryfallError;
    return error.warnings?.join(' - ') ?? error.details;
  } catch {
    return 'invalid query';
  }
};

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

  let response: ScryfallSearch;
  try {
    // Scryfall requires an explicit User-Agent and Accept header
    response = await upstreamFetch<ScryfallSearch>('Scryfall', url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'QueryAPI/1.0',
      },
    });
  } catch (error) {
    if (error instanceof UpstreamError) {
      // Scryfall returns 404 when no cards match
      if (error.status === 404) return [];
      // 400 means the query itself was rejected (e.g. unknown set code)
      if (error.status === 400) {
        throw new HTTPException(400, {
          message: `Scryfall: ${scryfallDetails(error.body)}`,
        });
      }
    }
    throw error;
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
        collector_number,
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
