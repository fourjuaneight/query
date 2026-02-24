// Cloudflare Workers environment bindings
export interface Bindings {
  TMDB_KEY: string;
  IGDB_CLIENT_ID: string;
  IGDB_ACCESS_TOKEN: string;
  DISCOGS_TOKEN: string;
  GITHUB_TOKEN: string;
}

// TMDB
export interface Genre {
  id: number;
  name: string;
}

export interface TMDBQueryOptions {
  language?: string;
  year?: number;
  page?: number;
}
