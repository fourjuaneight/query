import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { Bindings } from './typings';
import { TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './constants';

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
 * @param apiKey - The TMDB API key from env bindings
 * @param endpoint - The API endpoint path
 * @param params - Optional query parameters
 * @returns Parsed JSON response
 */
export const tmdbFetch = async <T>(
  apiKey: string,
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  try {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (networkError) {
      throw new Error(
        `[tmdbFetch]: Network error requesting ${endpoint} - ${String(networkError)}`,
      );
    }

    if (response.status !== 200) {
      const errorResp = await response.text();

      throw new Error(
        `[tmdbFetch]: ${response.status} - ${response.statusText} (${endpoint}) - ${errorResp}`,
      );
    }

    return parseJSON<T>(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[tmdbFetch] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[tmdbFetch] - ${String(error)}`);
    console.error(err.message);
    throw err;
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

/**
 * Standard JSON success response.
 */
export const jsonSuccess = (
  ctx: Context<{ Bindings: Bindings }>,
  data: unknown,
): Response => ctx.json({ success: true, data });

/**
 * Standard JSON error response.
 */
export const jsonError = (
  ctx: Context<{ Bindings: Bindings }>,
  message: string,
  status: ContentfulStatusCode = 400,
): Response => ctx.json({ success: false, error: message }, status);
