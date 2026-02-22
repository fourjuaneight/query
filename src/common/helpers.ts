import { TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './constants';

/**
 * Get the TMDB API key from environment variables
 *
 * @returns The TMDB API key
 */
export const getApiKey = (): string => {
  const key = process.env.TMDB_KEY;
  if (!key) {
    throw `(getApiKey): TMDB_KEY environment variable is not set`;
  }
  return key;
};

/**
 * Build full poster URL from path
 *
 * @param posterPath - The poster image path from TMDB
 * @returns Full poster URL or null if no path provided
 */
export const buildPosterUrl = (posterPath: string | null): string | null => {
  return posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;
};

/**
 * Make a request to the TMDB API
 *
 * @param endpoint - The API endpoint path
 * @param params - Optional query parameters
 * @returns Parsed JSON response
 */
export const tmdbFetch = async <T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  try {
    const apiKey = getApiKey();
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status !== 200) {
      const errorResp = await response.text();

      throw `(fetch): ${response.status} - ${response.statusText} (${endpoint}) - ${errorResp}`;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`(tmdbFetch): ${error}`);
    throw `(tmdbFetch): ${error}`;
  }
};
