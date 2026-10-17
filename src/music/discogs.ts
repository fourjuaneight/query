import type {
  DiscogsSearchParams,
  DiscogsSearchResponse,
  DiscogsQueryOptions,
  AlbumSearchResult,
  ArtistSearchResult,
  TrackSearchResult,
  PaginatedResults,
} from './typings';
import { buildUrl, upstreamFetch } from '../common/helpers';

const DISCOGS_SEARCH_URL = 'https://api.discogs.com/database/search';

type ReleaseOptions = DiscogsQueryOptions & { artist?: string };

/**
 * Issue a search query to the Discogs database
 * DOCS: https://www.discogs.com/developers#page:database,header:database-search
 */
const searchDiscogs = async (
  token: string,
  { query, ...params }: DiscogsSearchParams,
): Promise<DiscogsSearchResponse> =>
  upstreamFetch<DiscogsSearchResponse>(
    'Discogs',
    // Map 'query' to the Discogs 'q' parameter
    buildUrl(DISCOGS_SEARCH_URL, { ['q']: query, ...params }),
    {
      headers: {
        Authorization: `Discogs token=${token}`,
        'User-Agent': 'QueryAPI/1.0',
      },
    },
  );

/**
 * Shared release filters for album and track searches
 */
const releaseFilters = (options: ReleaseOptions): DiscogsSearchParams => ({
  artist: options.artist,
  year: options.year,
  genre: options.genre,
  style: options.style,
  format: options.format,
  country: options.country,
  per_page: options.perPage ?? 10,
  page: options.page ?? 1,
});

/**
 * Wrap mapped results with Discogs pagination info
 */
const paginate = <T>(
  response: DiscogsSearchResponse,
  results: T[],
): PaginatedResults<T> => ({
  results,
  totalResults: response.pagination.items,
  totalPages: response.pagination.pages,
  page: response.pagination.page,
});

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
  const response = await searchDiscogs(token, {
    query: name,
    type: 'artist',
    per_page: options.perPage ?? 10,
    page: options.page ?? 1,
  });

  return paginate(
    response,
    response.results.map(result => ({
      title: result.title,
      coverUrl: result.cover_image ?? null,
    })),
  );
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
  options: ReleaseOptions = {},
): Promise<PaginatedResults<AlbumSearchResult>> => {
  const response = await searchDiscogs(token, {
    release_title: title,
    type: 'master',
    ...releaseFilters(options),
  });

  return paginate(
    response,
    response.results.map(result => ({
      title: result.title,
      artist: parseTitle(result.title).artist,
      year: result.year ?? null,
      genres: result.genre ?? [],
      country: result.country ?? null,
      barcode: result.barcode ?? [],
      coverUrl: result.cover_image ?? null,
      community: result.community ?? null,
    })),
  );
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
  options: ReleaseOptions = {},
): Promise<PaginatedResults<TrackSearchResult>> => {
  const response = await searchDiscogs(token, {
    track,
    type: 'release',
    ...releaseFilters(options),
  });

  return paginate(
    response,
    response.results.map(result => {
      const { artist, name: album } = parseTitle(result.title);

      return {
        title: result.title,
        artist,
        album,
        year: result.year ?? null,
        genres: result.genre ?? [],
        country: result.country ?? null,
        coverUrl: result.cover_image ?? null,
      };
    }),
  );
};
