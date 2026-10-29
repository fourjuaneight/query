// Deezer API Types

export interface DeezerError {
  type: string;
  message: string;
  code: number;
}

/** Search endpoints answer with a page of `data` (or an `error`, with HTTP 200) */
export interface DeezerSearchResponse<T> {
  data?: T[];
  total?: number;
  next?: string;
  error?: DeezerError;
}

export interface DeezerArtist {
  id: number;
  name: string;
  link: string;
  picture_xl?: string;
  nb_album?: number;
  nb_fan?: number;
}

export interface DeezerAlbum {
  id: number;
  title: string;
  link: string;
  cover_xl?: string;
  nb_tracks?: number;
  record_type?: string;
  explicit_lyrics?: boolean;
  artist?: { id: number; name: string };
}

/** album/{id}: the fields that search results lack */
export interface DeezerAlbumDetails extends DeezerAlbum {
  upc?: string;
  label?: string;
  release_date?: string;
  genres?: { data: { id: number; name: string }[] };
  error?: DeezerError;
}

export interface DeezerTrack {
  id: number;
  title: string;
  link: string;
  /** Length in seconds */
  duration?: number;
  explicit_lyrics?: boolean;
  preview?: string;
  artist?: { id: number; name: string };
  album?: { id: number; title: string; cover_xl?: string };
}

// Normalized Output Types

export interface MusicQueryOptions {
  page?: number;
  perPage?: number;
}

export interface ReleaseQueryOptions extends MusicQueryOptions {
  artist?: string;
}

export interface AlbumQueryOptions extends ReleaseQueryOptions {
  /** Fetch release date, genres, label and UPC for every result (default true) */
  details?: boolean;
}

export interface ArtistSearchResult {
  id: number;
  name: string;
  albums: number | null;
  fans: number | null;
  pictureUrl: string | null;
  url: string;
}

export interface AlbumSearchResult {
  id: number;
  title: string;
  artist: string;
  /** Album, EP, single or compilation */
  type: string | null;
  tracks: number | null;
  explicit: boolean;
  /** Null without details (`details: false`), like the other detail fields */
  releaseDate: string | null;
  genres: string[];
  label: string | null;
  upc: string | null;
  coverUrl: string | null;
  url: string;
}

export interface TrackSearchResult {
  id: number;
  title: string;
  artist: string;
  album: string;
  /** Length in seconds */
  duration: number | null;
  explicit: boolean;
  previewUrl: string | null;
  coverUrl: string | null;
  url: string;
}

export interface PaginatedResults<T> {
  results: T[];
  totalResults: number;
  totalPages: number;
  page: number;
}
