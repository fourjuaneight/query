import type {
  QobuzAlbum,
  QobuzAlbumResult,
  QobuzAlbumSearchResponse,
  QobuzAlbumSearchResults,
  QobuzCredentials,
  QobuzSearchOptions,
} from './typings';
import { buildUrl, upstreamFetch } from '../common/helpers';

// Unofficial API used by the Qobuz web player (no public docs)
const QOBUZ_API = 'https://www.qobuz.com/api.json/0.2';
const QOBUZ_STORE = 'https://www.qobuz.com';
const QOBUZ_PLAYER = 'https://open.qobuz.com/album';

export const DEFAULT_STORE = 'us-en';

/** Store region and language segment of a Qobuz URL (e.g. "us-en", "gb-en") */
export const STORE = /^[a-z]{2}-[a-z]{2}$/;

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
): QobuzAlbumResult => ({
  id: album.id,
  title: album.title,
  version: album.version || null,
  artist: album.artist?.name ?? '',
  releaseDate: album.release_date_original ?? null,
  label: album.label?.name ?? null,
  genre: album.genre?.name ?? null,
  upc: album.upc ?? null,
  tracks: album.tracks_count ?? null,
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
 *
 * @param credentials - Qobuz app ID and user auth token
 * @param title - The album title to search for
 * @param options - Optional artist, store region, limit and offset
 * @returns Matching albums with store and player URLs
 */
export const searchAlbums = async (
  { appId, userAuthToken }: QobuzCredentials,
  title: string,
  options: QobuzSearchOptions = {},
): Promise<QobuzAlbumSearchResults> => {
  const store = options.store ?? DEFAULT_STORE;
  // Qobuz search is free text, so the artist joins the query
  const query = options.artist ? `${title} ${options.artist}` : title;

  const { albums } = await upstreamFetch<QobuzAlbumSearchResponse>(
    'Qobuz',
    buildUrl(`${QOBUZ_API}/album/search`, {
      query,
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
      app_id: appId,
    }),
    {
      headers: {
        'X-App-Id': appId,
        'X-User-Auth-Token': userAuthToken,
      },
    },
  );

  return {
    results: albums.items.map(album => normalizeAlbum(album, store)),
    total: albums.total,
    limit: albums.limit,
    offset: albums.offset,
  };
};
