import type {
  AlbumQueryOptions,
  AlbumSearchResult,
  ArtistSearchResult,
  DeezerAlbum,
  DeezerAlbumDetails,
  DeezerArtist,
  DeezerError,
  DeezerSearchResponse,
  DeezerTrack,
  MusicQueryOptions,
  PaginatedResults,
  ReleaseQueryOptions,
  TrackSearchResult,
} from './typings';
import { UpstreamError, buildUrl, upstreamFetch } from '../common/helpers';

const DEEZER_API = 'https://api.deezer.com';

/** Most albums per page. Each album costs one more request for its details. */
export const MAX_ALBUMS_PER_PAGE = 25;

/**
 * Deezer answers errors with HTTP 200 and an `error` body.
 * Map its codes to the statuses the app reports: quota (4) is a rate limit,
 * no data (800) is not found, and anything else is an upstream failure.
 * DOCS: https://developers.deezer.com/api/errors
 */
const errorStatus = (code: number): number => {
  if (code === 4) return 429;
  if (code === 800) return 404;
  return 502;
};

/**
 * Make a request to the Deezer API (no key needed)
 */
const deezerFetch = async <T extends { error?: DeezerError }>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  const body = await upstreamFetch<T>(
    'Deezer',
    buildUrl(`${DEEZER_API}${endpoint}`, params),
  );

  if (body.error) {
    const { code, type, message } = body.error;
    throw new UpstreamError(
      'Deezer',
      errorStatus(code),
      `${code} ${type}: ${message} (${endpoint})`,
    );
  }

  return body;
};

/**
 * Remove double quotes, which delimit fields in Deezer's advanced search
 */
const unquote = (value: string): string => value.replaceAll('"', '').trim();

/**
 * Build a search query. With an artist, use advanced search
 * (`artist:"…" album:"…"`) so both fields must match.
 * DOCS: https://developers.deezer.com/api/search
 */
const searchQuery = (
  field: 'album' | 'track',
  value: string,
  artist?: string,
): string =>
  artist ? `artist:"${unquote(artist)}" ${field}:"${unquote(value)}"` : value;

/**
 * Issue a search request and wrap mapped results with pagination info.
 * Deezer pages by `index` (offset) and `limit`.
 */
const search = async <T, R>(
  type: 'artist' | 'album' | 'track',
  query: string,
  { page = 1, perPage = 10 }: MusicQueryOptions,
  map: (items: T[]) => R[] | Promise<R[]>,
): Promise<PaginatedResults<R>> => {
  const response = await deezerFetch<DeezerSearchResponse<T>>(
    `/search/${type}`,
    { ['q']: query, index: (page - 1) * perPage, limit: perPage },
  );
  const total = response.total ?? 0;

  return {
    results: await map(response.data ?? []),
    totalResults: total,
    totalPages: Math.ceil(total / perPage),
    page,
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
  name: string,
  options: MusicQueryOptions = {},
): Promise<PaginatedResults<ArtistSearchResult>> =>
  search<DeezerArtist, ArtistSearchResult>('artist', name, options, artists =>
    artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      albums: artist.nb_album ?? null,
      fans: artist.nb_fan ?? null,
      pictureUrl: artist.picture_xl ?? null,
      url: artist.link,
    })),
  );

/**
 * Fetch the album fields that search results lack
 * DOCS: https://developers.deezer.com/api/album
 */
const getAlbumDetails = async (id: number): Promise<DeezerAlbumDetails> =>
  deezerFetch<DeezerAlbumDetails>(`/album/${id}`);

const normalizeAlbum = (
  album: DeezerAlbum,
  details: DeezerAlbumDetails | null,
): AlbumSearchResult => ({
  id: album.id,
  title: album.title,
  artist: album.artist?.name ?? '',
  type: album.record_type ?? null,
  tracks: album.nb_tracks ?? null,
  explicit: album.explicit_lyrics ?? false,
  releaseDate: details?.release_date ?? null,
  genres: details?.genres?.data.map(genre => genre.name) ?? [],
  label: details?.label ?? null,
  upc: details?.upc ?? null,
  coverUrl: album.cover_xl ?? null,
  url: album.link,
});

/**
 * Search for an album by title, optionally by one artist.
 * Search results have no release date, genres, label or UPC, so each album
 * costs one more request (album/{id}). With `details: false`, skips those
 * requests and makes 1 request instead of up to 26.
 *
 * @param title - The album title to search for
 * @param options - Optional artist, page, perPage and details
 * @returns Paginated list of matching albums
 */
export const searchAlbum = async (
  title: string,
  { artist, details, ...pagination }: AlbumQueryOptions = {},
): Promise<PaginatedResults<AlbumSearchResult>> =>
  search<DeezerAlbum, AlbumSearchResult>(
    'album',
    searchQuery('album', title, artist),
    pagination,
    albums =>
      Promise.all(
        albums.map(async album =>
          normalizeAlbum(
            album,
            details === false ? null : await getAlbumDetails(album.id),
          ),
        ),
      ),
  );

/**
 * Search for a song (track) by title, optionally by one artist
 *
 * @param track - The track/song title to search for
 * @param options - Optional artist, page and perPage
 * @returns Paginated list of matching tracks
 */
export const searchTrack = async (
  track: string,
  { artist, ...pagination }: ReleaseQueryOptions = {},
): Promise<PaginatedResults<TrackSearchResult>> =>
  search<DeezerTrack, TrackSearchResult>(
    'track',
    searchQuery('track', track, artist),
    pagination,
    tracks =>
      tracks.map(result => ({
        id: result.id,
        title: result.title,
        artist: result.artist?.name ?? '',
        album: result.album?.title ?? '',
        duration: result.duration ?? null,
        explicit: result.explicit_lyrics ?? false,
        previewUrl: result.preview || null,
        coverUrl: result.album?.cover_xl ?? null,
        url: result.link,
      })),
  );
