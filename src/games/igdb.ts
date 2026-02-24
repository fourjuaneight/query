import type {
  IGDBGameSearchResult,
  IGDBQueryOptions,
  GameData,
} from './typings';
import { parseJSON } from '../common/helpers';

interface IGDBEnv {
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const IGDB_IMAGE_BASE_URL = 'https://images.igdb.com/igdb/image/upload';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

/** Cached OAuth token and its expiry time */
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

/**
 * Obtain an OAuth2 access token from Twitch using client credentials
 * DOCS: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow
 *
 * Caches the token in memory and refreshes it when expired.
 */
const getAccessToken = async (env: IGDBEnv): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  let response: Response;
  try {
    const url = new URL(TWITCH_TOKEN_URL);
    url.searchParams.set('client_id', env.TWITCH_CLIENT_ID);
    url.searchParams.set('client_secret', env.TWITCH_CLIENT_SECRET);
    url.searchParams.set('grant_type', 'client_credentials');

    response = await fetch(url.toString(), { method: 'POST' });
  } catch (networkError) {
    throw new Error(
      `(getAccessToken): Network error fetching Twitch OAuth token - ${String(networkError)}`,
    );
  }

  if (response.status !== 200) {
    const errorResp = await response.text();
    throw new Error(
      `(getAccessToken): ${response.status} - ${response.statusText} - ${errorResp}`,
    );
  }

  const data = await parseJSON<TwitchTokenResponse>(response);

  // Cache with a 5-minute safety margin before actual expiry
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return cachedToken.accessToken;
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
const igdbFetch = async <T>(
  env: IGDBEnv,
  endpoint: string,
  body: string,
): Promise<T> => {
  try {
    const accessToken = await getAccessToken(env);

    let response: Response;
    try {
      response = await fetch(`${IGDB_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Client-ID': env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      });
    } catch (networkError) {
      throw new Error(
        `(igdbFetch): Network error requesting ${endpoint} - ${String(networkError)}`,
      );
    }

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
  env: IGDBEnv,
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

    const results = await igdbFetch<IGDBGameSearchResult[]>(
      env,
      '/games',
      body,
    );

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
export const queryGame = async (
  env: IGDBEnv,
  title: string,
): Promise<GameData | null> => {
  try {
    const results = await searchGames(env, title, { limit: 1 });

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
  env: IGDBEnv,
  gameId: number,
): Promise<GameData | null> => {
  try {
    const body = `
      fields name,summary,cover.image_id,cover.url,genres.name,platforms.name,
             involved_companies.company.name,involved_companies.developer,
             involved_companies.publisher,first_release_date,rating;
      where id = ${gameId};
    `.trim();

    const results = await igdbFetch<IGDBGameSearchResult[]>(
      env,
      '/games',
      body,
    );

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
