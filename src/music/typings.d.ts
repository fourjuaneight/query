// Discogs API Types

export interface DiscogsPagination {
  per_page: number;
  items: number;
  page: number;
  pages: number;
  urls: {
    next?: string;
    last?: string;
  };
}

export interface DiscogsCommunity {
  want: number;
  have: number;
}

export interface DiscogsSearchResult {
  id: number;
  type: 'release' | 'master' | 'artist' | 'label';
  title: string;
  uri: string;
  resource_url: string;
  thumb: string;
  cover_image?: string;
  country?: string;
  year?: string;
  format?: string[];
  genre?: string[];
  style?: string[];
  label?: string[];
  catno?: string;
  barcode?: string[];
  community?: DiscogsCommunity;
  master_id?: number;
  master_url?: string;
}

export interface DiscogsSearchResponse {
  pagination: DiscogsPagination;
  results: DiscogsSearchResult[];
}

export interface DiscogsSearchParams {
  query?: string;
  type?: 'release' | 'master' | 'artist' | 'label';
  title?: string;
  release_title?: string;
  credit?: string;
  artist?: string;
  anv?: string;
  label?: string;
  genre?: string;
  style?: string;
  country?: string;
  year?: string;
  format?: string;
  catno?: string;
  barcode?: string;
  track?: string;
  submitter?: string;
  contributor?: string;
  per_page?: number;
  page?: number;
}

// Normalized Output Types

export interface DiscogsQueryOptions {
  year?: string;
  genre?: string;
  style?: string;
  format?: string;
  country?: string;
  page?: number;
  perPage?: number;
}

export interface ArtistSearchResult {
  id: number;
  title: string;
  resourceUrl: string;
  thumbUrl: string;
}

export interface AlbumSearchResult {
  id: number;
  title: string;
  artist: string;
  year: string | null;
  genres: string[];
  styles: string[];
  formats: string[];
  labels: string[];
  country: string | null;
  resourceUrl: string;
  thumbUrl: string;
  community: DiscogsCommunity | null;
}

export interface TrackSearchResult {
  id: number;
  title: string;
  year: string | null;
  genres: string[];
  styles: string[];
  formats: string[];
  labels: string[];
  country: string | null;
  resourceUrl: string;
  thumbUrl: string;
}

export interface PaginatedResults<T> {
  results: T[];
  totalResults: number;
  totalPages: number;
  page: number;
}
