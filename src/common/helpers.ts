import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { AppEnv, Genre } from './typings';
import { TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './constants';

type QueryParams = Record<string, string | number | undefined>;

/**
 * Error raised when a 3rd-party API request fails.
 * Carries the upstream status so the app can map it to a client response
 * without leaking the upstream body (kept in `message` for logs only).
 */
export class UpstreamError extends Error {
  override readonly name = 'UpstreamError';

  constructor(
    readonly service: string,
    readonly status: number,
    message: string,
    /** Truncated upstream response body (for callers that parse API errors) */
    readonly body = '',
  ) {
    super(`[${service}] ${message}`);
  }
}

/**
 * Build a URL from a base and a set of query params, skipping undefined values.
 */
export const buildUrl = (base: string, params: QueryParams = {}): URL => {
  const url = new URL(base);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
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
  response.json<T>();

/**
 * Fetch JSON from a 3rd-party API.
 * Throws an UpstreamError on network failure or non-2xx status.
 * Only the URL path is included in error messages so API keys passed
 * as query params never reach the logs.
 *
 * @param service - Display name of the upstream service (used in errors)
 * @param url - The request URL
 * @param init - Optional fetch init
 * @returns Parsed JSON response
 */
export const upstreamFetch = async <T>(
  service: string,
  url: string | URL,
  init: RequestInit = {},
): Promise<T> => {
  const target = new URL(url);

  let response: Response;
  try {
    response = await fetch(target.toString(), init);
  } catch (networkError) {
    throw new UpstreamError(
      service,
      0,
      `Network error requesting ${target.pathname} - ${String(networkError)}`,
    );
  }

  if (!response.ok) {
    const errorResp = (await response.text()).slice(0, 500);
    throw new UpstreamError(
      service,
      response.status,
      `${response.status} ${response.statusText} (${target.pathname}) - ${errorResp}`,
      errorResp,
    );
  }

  return parseJSON<T>(response);
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
 * @param apiKey - The TMDB API key from env bindings
 * @param endpoint - The API endpoint path
 * @param params - Optional query parameters
 * @returns Parsed JSON response
 */
export const tmdbFetch = async <T>(
  apiKey: string,
  endpoint: string,
  params: QueryParams = {},
): Promise<T> =>
  upstreamFetch<T>(
    'TMDB',
    buildUrl(`${TMDB_BASE_URL}${endpoint}`, { api_key: apiKey, ...params }),
  );

/**
 * Fetch the TMDB genre list as an id → name map
 * DOCS: https://developer.themoviedb.org/reference/genre-movie-list
 *
 * @param apiKey - The TMDB API key from env bindings
 * @param media - Which genre list to fetch
 * @param language - Optional language code (default: "en-US")
 * @returns Map of genre ID to genre name
 */
export const tmdbGenres = async (
  apiKey: string,
  media: 'movie' | 'tv',
  language = 'en-US',
): Promise<Map<number, string>> => {
  const { genres } = await tmdbFetch<{ genres: Genre[] }>(
    apiKey,
    `/genre/${media}/list`,
    { language },
  );
  return new Map(genres.map(genre => [genre.id, genre.name]));
};

/**
 * Standard JSON success response.
 */
export const jsonSuccess = (ctx: Context<AppEnv>, data: unknown): Response =>
  ctx.json({ success: true, data });

/**
 * Standard JSON error response.
 */
export const jsonError = (
  ctx: Context<AppEnv>,
  message: string,
  status: ContentfulStatusCode = 400,
): Response => ctx.json({ success: false, error: message }, status);

/**
 * Map any thrown error to a standard JSON error response.
 * - HTTPException (validation, auth): its own status and message
 * - UpstreamError: 404/429 pass through, everything else becomes 502
 * - Anything else: generic 500
 * Upstream details are logged, never returned to the client.
 */
export const errorResponse = (err: Error, ctx: Context<AppEnv>): Response => {
  if (err instanceof HTTPException) {
    return err.res
      ? err.getResponse()
      : jsonError(ctx, err.message, err.status);
  }

  console.error(err.message);

  if (err instanceof UpstreamError) {
    if (err.status === 404) {
      return jsonError(ctx, `${err.service}: not found`, 404);
    }
    if (err.status === 429) {
      return jsonError(ctx, `${err.service}: rate limit exceeded`, 429);
    }
    return jsonError(ctx, `${err.service}: upstream request failed`, 502);
  }

  return jsonError(ctx, 'Internal Server Error', 500);
};
