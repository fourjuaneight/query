import type {
  QobuzAlbum,
  QobuzAlbumDetails,
  QobuzAlbumResult,
  QobuzAlbumSearchResponse,
  QobuzAlbumSearchResults,
  QobuzCredentials,
  QobuzSearchOptions,
  QobuzTrack,
  QobuzTrackResult,
} from './typings';
import { buildUrl, upstreamFetch } from '../common/helpers';

// Unofficial API used by the Qobuz web player (no public docs)
const QOBUZ_API = 'https://www.qobuz.com/api.json/0.2';
const QOBUZ_STORE = 'https://www.qobuz.com';
const QOBUZ_PLAYER = 'https://open.qobuz.com/album';

export const DEFAULT_STORE = 'us-en';

/** Store region and language segment of a Qobuz URL (e.g. "us-en", "gb-en") */
export const STORE = /^[a-z]{2}-[a-z]{2}$/;

/** Most results per search. Each result costs one more request for its tracks. */
export const MAX_LIMIT = 25;

/**
 * Make a request to the Qobuz API with the web player's credentials
 */
const qobuzFetch = async <T>(
  { appId, userAuthToken }: QobuzCredentials,
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> =>
  upstreamFetch<T>(
    'Qobuz',
    buildUrl(`${QOBUZ_API}${endpoint}`, { ...params, app_id: appId }),
    {
      headers: {
        'X-App-Id': appId,
        'X-User-Auth-Token': userAuthToken,
      },
    },
  );

/**
 * Fetch an album's track list
 */
const getAlbumTracks = async (
  credentials: QobuzCredentials,
  albumId: string,
): Promise<QobuzTrack[]> => {
  const album = await qobuzFetch<QobuzAlbumDetails>(credentials, '/album/get', {
    album_id: albumId,
  });
  return album.tracks?.items ?? [];
};

const normalizeTrack = (track: QobuzTrack): QobuzTrackResult => ({
  disc: track.media_number ?? null,
  number: track.track_number ?? null,
  title: track.title,
  version: track.version || null,
  artist: track.performer?.name ?? null,
  duration: track.duration ?? null,
  isrc: track.isrc ?? null,
});

/**
 * Build the store page URL for an album.
 * Store pages use "/{store}/album/{slug}/{id}". Without a slug, fall back to
 * the URL in the API response (if any).
 */
const storeUrl = (album: QobuzAlbum, store: string): string | null =>
  album.slug
    ? `${QOBUZ_STORE}/${store}/album/${album.slug}/${album.id}`
    : (album.url ?? null);

const normalizeAlbum = (
  album: QobuzAlbum,
  store: string,
  tracks: QobuzTrack[] | null,
): QobuzAlbumResult => ({
  id: album.id,
  title: album.title,
  version: album.version || null,
  artist: album.artist?.name ?? '',
  releaseDate: album.release_date_original ?? null,
  label: album.label?.name ?? null,
  genre: album.genre?.name ?? null,
  upc: album.upc ?? null,
  trackCount: album.tracks_count ?? null,
  tracks: tracks?.map(normalizeTrack) ?? null,
  hiRes: album.hires ?? false,
  purchasable: album.purchasable ?? false,
  streamable: album.streamable ?? false,
  coverUrl: album.image?.large ?? album.image?.small ?? null,
  storeUrl: storeUrl(album, store),
  playerUrl: `${QOBUZ_PLAYER}/${album.id}`,
});

/**
 * Search the Qobuz catalog for albums and return their store links.
 * Uses the same app ID and user auth token as the Qobuz web player
 * (see streamrip: https://github.com/nathom/streamrip).
 * Search results have no tracks, so each album's track list is one more
 * request (album/get). With `tracks: false`, skips those requests
 * (`tracks` is null) and makes 1 request instead of up to 26.
 *
 * @param credentials - Qobuz app ID and user auth token
 * @param title - The album title to search for
 * @param options - Optional artist, store region, limit, offset and tracks
 * @returns Matching albums with store and player URLs and track lists
 */
export const searchAlbums = async (
  credentials: QobuzCredentials,
  title: string,
  options: QobuzSearchOptions = {},
): Promise<QobuzAlbumSearchResults> => {
  const store = options.store ?? DEFAULT_STORE;
  // Qobuz search is free text, so the artist joins the query
  const query = options.artist ? `${title} ${options.artist}` : title;

  const { albums } = await qobuzFetch<QobuzAlbumSearchResponse>(
    credentials,
    '/album/search',
    { query, limit: options.limit ?? 10, offset: options.offset ?? 0 },
  );

  const results = await Promise.all(
    albums.items.map(async album =>
      normalizeAlbum(
        album,
        store,
        options.tracks === false
          ? null
          : await getAlbumTracks(credentials, album.id),
      ),
    ),
  );

  return {
    results,
    total: albums.total,
    limit: albums.limit,
    offset: albums.offset,
  };
};
