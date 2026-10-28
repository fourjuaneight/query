// Qobuz API Types (unofficial; fields seen on album/search results)

export interface QobuzImage {
  thumbnail?: string;
  small?: string;
  large?: string;
}

export interface QobuzAlbum {
  id: string;
  title: string;
  version?: string | null;
  slug?: string;
  url?: string;
  upc?: string;
  release_date_original?: string;
  tracks_count?: number;
  hires?: boolean;
  purchasable?: boolean;
  streamable?: boolean;
  artist?: { id: number; name: string };
  label?: { id: number; name: string };
  genre?: { id: number; name: string };
  image?: QobuzImage;
}

export interface QobuzAlbumSearchResponse {
  query: string;
  albums: {
    limit: number;
    offset: number;
    total: number;
    items: QobuzAlbum[];
  };
}

// Normalized Output Types

export interface QobuzCredentials {
  appId: string;
  userAuthToken: string;
}

export interface QobuzSearchOptions {
  artist?: string;
  /** Store region and language, as in the store URL (default "us-en") */
  store?: string;
  limit?: number;
  offset?: number;
}

export interface QobuzAlbumResult {
  id: string;
  title: string;
  version: string | null;
  artist: string;
  releaseDate: string | null;
  label: string | null;
  genre: string | null;
  upc: string | null;
  tracks: number | null;
  hiRes: boolean;
  purchasable: boolean;
  streamable: boolean;
  coverUrl: string | null;
  storeUrl: string | null;
  playerUrl: string;
}

export interface QobuzAlbumSearchResults {
  results: QobuzAlbumResult[];
  total: number;
  limit: number;
  offset: number;
}
