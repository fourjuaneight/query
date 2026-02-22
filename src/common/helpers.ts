import { TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './constants';

/**
 * Get the TMDB API key from environment variables
 *
 * @returns The TMDB API key
 */
export const getApiKey = (): string => {
  const key = process.env['TMDB_KEY'];

  if (!key) {
    throw new Error('(getApiKey): TMDB_KEY environment variable is not set');
  }

  return key;
};

/**
 * Build full poster URL from path
 *
 * @param posterPath - The poster image path from TMDB
 * @returns Full poster URL or null if no path provided
 */
export const buildPosterUrl = (posterPath: string | null): string | null =>
  posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;

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

      throw new Error(
        `(tmdbFetch): ${response.status} - ${response.statusText} (${endpoint}) - ${errorResp}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`(tmdbFetch): ${error.message}`);
    }

    throw new Error(`(tmdbFetch): ${String(error)}`);
  }
};

/**
 * Safely parse a JSON response body with a generic type assertion.
 * Centralizes the untyped Response.json() → T conversion so all
 * callers get properly typed data without per-call ESLint suppressions.
 *
 * @param response - The fetch Response to parse
 * @returns Parsed JSON body typed as T
 */
export const parseJSON = async <T>(response: Response): Promise<T> =>
  (await response.json()) as T;
