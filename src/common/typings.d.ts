import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

// Cloudflare Workers environment bindings
export interface Bindings {
  TMDB_KEY: string;
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
  DISCOGS_TOKEN: string;
  GH_TOKEN: string;
  YOUTUBE_KEY: string;
  /** Optional shared secret. When set, REST requests must send `Authorization: Bearer <API_KEY>`. It is also the MCP sign-in password; without it, MCP is off. */
  API_KEY?: string;
  /** Optional Workers Rate Limiting binding (see wrangler.toml). */
  RATE_LIMITER?: RateLimit;
  /** KV namespace for OAuth clients, grants and tokens (MCP only). */
  OAUTH_KV?: KVNamespace;
  /** OAuth helpers, injected by OAuthProvider for the /authorize page (absent under Node). */
  OAUTH_PROVIDER?: OAuthHelpers;
}

export interface AppEnv {
  Bindings: Bindings;
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
  /** Search only: fetch full details for every result (default true) */
  details?: boolean;
}
