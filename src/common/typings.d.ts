// Cloudflare Workers environment bindings
export interface Bindings {
  TMDB_KEY: string;
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
  DISCOGS_TOKEN: string;
  GITHUB_TOKEN: string;
  YOUTUBE_KEY: string;
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
