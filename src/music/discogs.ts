import type {
  DiscogsSearchParams,
  DiscogsSearchResponse,
  DiscogsQueryOptions,
  AlbumSearchResult,
  ArtistSearchResult,
  TrackSearchResult,
  PaginatedResults,
} from './typings';

const DISCOGS_BASE_URL = 'https://api.discogs.com';

/**
 * Make a request to the Discogs API
 * DOCS: https://www.discogs.com/developers
 */
const discogsFetch = async <T>(
  token: string,
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  try {
    const url = new URL(`${DISCOGS_BASE_URL}${endpoint}`);

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
          Authorization: `Discogs token=${token}`,
          'User-Agent': 'QueryAPI/1.0',
        },
      });
    } catch (networkError) {
      throw new Error(
        `(discogsFetch): Network error requesting ${endpoint} - ${String(networkError)}`,
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
    throw new Error(`(discogsFetch): ${String(error)}`);
  }
};

/**
 * Issue a search query to the Discogs database
 * DOCS: https://www.discogs.com/developers#page:database,header:database-search
 */
const searchDiscogs = async (
  token: string,
  params: DiscogsSearchParams,
): Promise<DiscogsSearchResponse> => {
  const searchParams: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' || typeof value === 'number') {
      // Map 'query' to the Discogs 'q' parameter
      const paramKey = key === 'query' ? 'q' : key;
      searchParams[paramKey] = value;
    }
  }

  return discogsFetch<DiscogsSearchResponse>(token, '/database/search', searchParams);
};

/**
 * Parse "Artist - Title" format from Discogs search result title
 */
const parseTitle = (title: string): { artist: string; name: string } => {
  const separatorIndex = title.indexOf(' - ');
  if (separatorIndex === -1) {
    return { artist: '', name: title };
  }
  return {
    artist: title.substring(0, separatorIndex),
    name: title.substring(separatorIndex + 3),
  };
};

/**
 * Search for an artist by name
 *
 * @param name - The artist name to search for
 * @param options - Optional query parameters (page, perPage)
 * @returns Paginated list of matching artists
 */
export const searchArtist = async (
  token: string,
  name: string,
  options: Pick<DiscogsQueryOptions, 'page' | 'perPage'> = {},
): Promise<PaginatedResults<ArtistSearchResult>> => {
  try {
    const response = await searchDiscogs(token, {
      query: name,
      type: 'artist',
      per_page: options.perPage ?? 10,
      page: options.page ?? 1,
    });

    return {
      results: response.results.map(result => ({
        title: result.title,
        coverUrl: result.cover_image ?? null,
      })),
      totalResults: response.pagination.items,
      totalPages: response.pagination.pages,
      page: response.pagination.page,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[searchArtist] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[searchArtist] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};

/**
 * Search for an album (release) by title
 * Optionally filter by artist, year, genre, format, and country
 *
 * @param title - The album title to search for
 * @param options - Optional query parameters
 * @returns Paginated list of matching albums
 */
export const searchAlbum = async (
  token: string,
  title: string,
  options: DiscogsQueryOptions & { artist?: string } = {},
): Promise<PaginatedResults<AlbumSearchResult>> => {
  try {
    const response = await searchDiscogs(token, {
      release_title: title,
      type: 'master',
      ...(options.artist && { artist: options.artist }),
      ...(options.year && { year: options.year }),
      ...(options.genre && { genre: options.genre }),
      ...(options.style && { style: options.style }),
      ...(options.format && { format: options.format }),
      ...(options.country && { country: options.country }),
      per_page: options.perPage ?? 10,
      page: options.page ?? 1,
    });

    return {
      results: response.results.map(result => {
        const { artist } = parseTitle(result.title);

        return {
          title: result.title,
          artist,
          year: result.year ?? null,
          genres: result.genre ?? [],
          country: result.country ?? null,
          barcode: result.barcode ?? [],
          coverUrl: result.cover_image ?? null,
          community: result.community ?? null,
        };
      }),
      totalResults: response.pagination.items,
      totalPages: response.pagination.pages,
      page: response.pagination.page,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[searchAlbum] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[searchAlbum] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};

/**
 * Search for a song (track) across releases
 *
 * @param track - The track/song title to search for
 * @param options - Optional query parameters
 * @returns Paginated list of releases containing the track
 */
export const searchTrack = async (
  token: string,
  track: string,
  options: DiscogsQueryOptions & { artist?: string } = {},
): Promise<PaginatedResults<TrackSearchResult>> => {
  try {
    const response = await searchDiscogs(token, {
      track,
      type: 'release',
      ...(options.artist && { artist: options.artist }),
      ...(options.year && { year: options.year }),
      ...(options.genre && { genre: options.genre }),
      ...(options.style && { style: options.style }),
      ...(options.format && { format: options.format }),
      ...(options.country && { country: options.country }),
      per_page: options.perPage ?? 10,
      page: options.page ?? 1,
    });

    return {
      results: response.results.map(result => {
        const { artist } = parseTitle(result.title);

        return {
          title: result.title,
          artist,
          year: result.year ?? null,
          genres: result.genre ?? [],
          country: result.country ?? null,
          coverUrl: result.cover_image ?? null,
        };
      }),
      totalResults: response.pagination.items,
      totalPages: response.pagination.pages,
      page: response.pagination.page,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[searchTrack] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[searchTrack] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};
