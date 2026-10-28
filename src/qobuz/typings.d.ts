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

export interface QobuzTrack {
  id: number;
  title: string;
  version?: string | null;
  track_number?: number;
  media_number?: number;
  duration?: number;
  isrc?: string;
  performer?: { id: number; name: string };
}

/** album/get: the album with its track list */
export interface QobuzAlbumDetails extends QobuzAlbum {
  tracks?: {
    limit: number;
    offset: number;
    total: number;
    items: QobuzTrack[];
  };
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
  /** Fetch the track list of every result (default true) */
  tracks?: boolean;
}

export interface QobuzTrackResult {
  disc: number | null;
  number: number | null;
  title: string;
  version: string | null;
  artist: string | null;
  /** Length in seconds */
  duration: number | null;
  isrc: string | null;
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
  trackCount: number | null;
  /** Null when the search skips track lists (`tracks: false`) */
  tracks: QobuzTrackResult[] | null;
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
