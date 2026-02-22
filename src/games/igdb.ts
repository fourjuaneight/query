import type {
  IGDBGameSearchResult,
  IGDBQueryOptions,
  GameData,
} from './typings';

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const IGDB_IMAGE_BASE_URL = 'https://images.igdb.com/igdb/image/upload';

/**
 * Get the IGDB Client ID from environment variables
 */
const getClientId = (): string => {
  const clientId = process.env['IGDB_CLIENT_ID'];
  if (!clientId) {
    throw new Error(
      '(getClientId): IGDB_CLIENT_ID environment variable is not set',
    );
  }
  return clientId;
};

/**
 * Get the IGDB Access Token from environment variables
 */
const getAccessToken = (): string => {
  const token = process.env['IGDB_ACCESS_TOKEN'];
  if (!token) {
    throw new Error(
      '(getAccessToken): IGDB_ACCESS_TOKEN environment variable is not set',
    );
  }
  return token;
};

/**
 * Build a cover image URL from an image_id
 * DOCS: https://api-docs.igdb.com/#images
 */
const buildCoverUrl = (
  imageId: string | undefined,
  size = 'cover_big',
): string | null => {
  if (!imageId) return null;
  return `${IGDB_IMAGE_BASE_URL}/t_${size}/${imageId}.jpg`;
};

/**
 * Make a POST request to the IGDB API using Apicalypse query syntax
 * DOCS: https://api-docs.igdb.com/#about
 */
const igdbFetch = async <T>(endpoint: string, body: string): Promise<T> => {
  try {
    const clientId = getClientId();
    const accessToken = getAccessToken();

    const response = await fetch(`${IGDB_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });

    if (response.status !== 200) {
      const errorResp = await response.text();
      throw new Error(
        `(fetch): ${response.status} - ${response.statusText} (${endpoint}) - ${errorResp}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`(igdbFetch): ${String(error)}`);
  }
};

/**
 * Format a Unix timestamp to an ISO date string (YYYY-MM-DD)
 */
const formatReleaseDate = (timestamp?: number): string | null => {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString().split('T')[0] ?? null;
};

/**
 * Normalize an IGDB game search result into a GameData object
 */
const normalizeGameData = (game: IGDBGameSearchResult): GameData => {
  const developers =
    game.involved_companies
      ?.filter(ic => ic.developer)
      .map(ic => ic.company.name) ?? [];

  const publishers =
    game.involved_companies
      ?.filter(ic => ic.publisher)
      .map(ic => ic.company.name) ?? [];

  return {
    title: game.name,
    summary: game.summary ?? null,
    releaseDate: formatReleaseDate(game.first_release_date),
    genres: game.genres?.map(genre => genre.name) ?? [],
    platforms: game.platforms?.map(platform => platform.name) ?? [],
    developers,
    publishers,
    coverUrl: buildCoverUrl(game.cover?.image_id),
    rating: game.rating ? Math.round(game.rating) : null,
  };
};

/**
 * Search for video games by title
 * DOCS: https://api-docs.igdb.com/#search
 *
 * @param query - The game title to search for
 * @param options - Optional query parameters (limit)
 * @returns Array of normalized game data
 */
export const searchGames = async (
  query: string,
  options: IGDBQueryOptions = {},
): Promise<GameData[]> => {
  try {
    const limit = options.limit ?? 10;

    const body = `
      search "${query}";
      fields name,summary,cover.image_id,cover.url,genres.name,platforms.name,
             involved_companies.company.name,involved_companies.developer,
             involved_companies.publisher,first_release_date,rating;
      where version_parent = null;
      limit ${limit};
    `.trim();

    const results = await igdbFetch<IGDBGameSearchResult[]>('/games', body);

    return results.map(normalizeGameData);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[searchGames] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[searchGames] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};

/**
 * Search for a video game by title and return the first (most relevant) result
 *
 * @param title - The game title to search for
 * @returns Normalized game data or null if not found
 */
export const queryGame = async (title: string): Promise<GameData | null> => {
  try {
    const results = await searchGames(title, { limit: 1 });

    if (results.length === 0) {
      return null;
    }

    const first = results[0];
    if (!first) return null;

    return first;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[queryGame] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[queryGame] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};

/**
 * Get a video game by its IGDB ID
 *
 * @param gameId - The IGDB game ID
 * @returns Normalized game data or null if not found
 */
export const queryGameById = async (
  gameId: number,
): Promise<GameData | null> => {
  try {
    const body = `
      fields name,summary,cover.image_id,cover.url,genres.name,platforms.name,
             involved_companies.company.name,involved_companies.developer,
             involved_companies.publisher,first_release_date,rating;
      where id = ${gameId};
    `.trim();

    const results = await igdbFetch<IGDBGameSearchResult[]>('/games', body);

    if (results.length === 0) {
      return null;
    }

    const first = results[0];
    if (!first) return null;

    return normalizeGameData(first);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[queryGameById] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[queryGameById] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};
