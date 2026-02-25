# Query

Wrappers around frequently used 3rd-party APIs.

## Overview

Query is a lightweight API aggregation service that wraps commonly used (for me) 3rd-party APIs behind a single, consistent interface. Each API module lives in its own directory under `src/` with a clear separation of concerns:

- **API client** (e.g. `openlibrary.ts`, `igdb.ts`) — handles authentication, fetching, and data normalization.
- **Handler** (`handler.ts`) — validates incoming request parameters and returns standardized JSON responses.
- **Types** (`typings.d.ts`) — TypeScript type definitions for both raw API responses and normalized output.

Routes are registered in [`src/app.ts`](src/app.ts) using [Hono](https://hono.dev), a small, fast web framework designed for edge runtimes. Hono was chosen because it runs natively on Cloudflare Workers with zero additional adapters, has a familiar Express-like API, and adds virtually no overhead.

All responses follow a uniform shape:

```json
{ "success": true, "data": { ... } }
```

or on error:

```json
{ "success": false, "error": "..." }
```

## Documentation

Links to the upstream API documentation for every integrated service:

| Service | Docs |
|---|---|
| OpenLibrary (Books) | [Read API](https://openlibrary.org/dev/docs/api/read) · [Search API](https://openlibrary.org/dev/docs/api/search) |
| IGDB (Games) | [API Docs](https://api-docs.igdb.com/) |
| MangaDex (Manga) | [API Reference](https://api.mangadex.org/docs/redoc.html) |
| TMDB (Movies & TV) | [API Docs](https://developer.themoviedb.org/docs) |
| Scryfall (MTG) | [API Reference](https://scryfall.com/docs/api) · [Search Syntax](https://scryfall.com/docs/syntax) |
| Discogs (Music) | [API Docs](https://www.discogs.com/developers) |
| TCGdex (Pokémon TCG) | [API Reference](https://tcgdex.dev/reference/card) |
| GitHub (Repos) | [REST API](https://docs.github.com/en/rest) |
| YouTube | [Data API v3](https://developers.google.com/youtube/v3/docs) |

## Credentials

The following environment variables must be set. Configure them as [Wrangler secrets](https://developers.cloudflare.com/workers/configuration/secrets/) or export them in your shell for local development.

| Variable | Service | Where to get it |
|---|---|---|
| `TMDB_KEY` | TMDB (Movies & TV Shows) | [TMDB API Settings](https://www.themoviedb.org/settings/api) |
| `TWITCH_CLIENT_ID` | IGDB (Games) | [Twitch Developer Console](https://dev.twitch.tv/console/apps) |
| `TWITCH_CLIENT_SECRET` | IGDB (Games) | [Twitch OAuth Client Credentials](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow) |
| `DISCOGS_TOKEN` | Discogs (Music) | [Discogs Developer Settings](https://www.discogs.com/settings/developers) |
| `GH_TOKEN` | GitHub (Repos) | [GitHub Personal Access Tokens](https://github.com/settings/tokens) |
| `YOUTUBE_KEY` | YouTube | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

> **Note:** OpenLibrary, MangaDex, Scryfall, and TCGdex do not require authentication tokens.

## Install

**Prerequisites:** Node.js and [pnpm](https://pnpm.io/).

```sh
# Clone the repository
git clone https://github.com/fourjuaneight/query.git
cd query

# Install dependencies
pnpm install

# Start the local development server (uses Wrangler)
pnpm dev

# Or run locally with Node via tsx
pnpm dev:local
```

For more on Hono's API and features, see the [Hono documentation](https://hono.dev/docs/).

## Usage

All endpoints accept `GET` requests with query parameters. Below is the full route reference:

### Books

| Endpoint | Parameters | Description |
|---|---|---|
| `/books/isbn` | `isbn` (required) | Look up a book by ISBN |
| `/books/search` | `title` (required), `limit`, `page`, `language` | Search books by title |

### Games

| Endpoint | Parameters | Description |
|---|---|---|
| `/games/search` | `query` (required), `limit` | Search games |
| `/games/query` | `title` (required) | Query a single game by title |
| `/games/:id` | `:id` (path) | Get a game by IGDB ID |

### Manga

| Endpoint | Parameters | Description |
|---|---|---|
| `/manga/search` | `title` (required), `limit`, `offset` | Search manga by title |
| `/manga/:id` | `:id` (path) | Get manga details by MangaDex ID |

### Movies

| Endpoint | Parameters | Description |
|---|---|---|
| `/movies/query` | `title` (required), `language`, `year` | Query a single movie by title |
| `/movies/search` | `query` (required), `language`, `year`, `page` | Search movies |
| `/movies/:id` | `:id` (path), `language` | Get a movie by TMDB ID |

### MTG Cards

| Endpoint | Parameters | Description |
|---|---|---|
| `/mtg/cards` | `name` (required), `set`, `number` | Search Magic: The Gathering cards |

### Music

| Endpoint | Parameters | Description |
|---|---|---|
| `/music/artists` | `name` (required), `page`, `per_page` | Search artists on Discogs |
| `/music/albums` | `title` (required), `artist`, `year`, `genre`, `page`, `per_page` | Search albums |
| `/music/tracks` | `track` (required), `artist`, `year`, `genre`, `page`, `per_page` | Search tracks |

### Pokémon TCG

| Endpoint | Parameters | Description |
|---|---|---|
| `/pkm/cards` | `name` (required), `set` | Search Pokémon TCG cards |

### Repos

| Endpoint | Parameters | Description |
|---|---|---|
| `/repos/search` | `query` (required), `language`, `sort`, `order`, `page`, `per_page` | Search GitHub repositories |
| `/repos/query` | `name` (required) | Query a single repo by name |

### TV Shows

| Endpoint | Parameters | Description |
|---|---|---|
| `/shows/query` | `title` (required), `language`, `year` | Query a single TV show by title |
| `/shows/search` | `query` (required), `language`, `year`, `page` | Search TV shows |
| `/shows/:id` | `:id` (path), `language` | Get a TV show by TMDB ID |

### YouTube

| Endpoint | Parameters | Description |
|---|---|---|
| `/yt/video` | `url` (required) | Get video details by YouTube URL or video ID |

### Example

```sh
# Search for a book
curl "http://localhost:8787/books/search?title=Dune&limit=5"

# Look up a YouTube video
curl "http://localhost:8787/yt/video?url=https://youtu.be/YQWLndmkofU"

# Look up an MTG card
curl "http://localhost:8787/mtg/cards?name=Black+Lotus"
```

## Deployment

This project is configured to deploy to [Cloudflare Workers](https://developers.cloudflare.com/workers/) via [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/). The configuration lives in [`wrangler.toml`](wrangler.toml).

```sh
# Build the worker bundle
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy
```

Before deploying, make sure all required secrets are set in your Cloudflare dashboard or via the Wrangler CLI:

```sh
wrangler secret put TMDB_KEY
wrangler secret put TWITCH_CLIENT_ID
wrangler secret put TWITCH_CLIENT_SECRET
wrangler secret put DISCOGS_TOKEN
wrangler secret put GH_TOKEN
wrangler secret put YOUTUBE_KEY
```

For more details, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).

## Testing

Tests are written with [Vitest](https://vitest.dev/) and live alongside their source files as `*.test.ts`. Every handler and shared helper has coverage.

```sh
# Run the full test suite
pnpm test

# Run in watch mode during development
pnpm test:watch

# Run with coverage report
pnpm test:coverage
```

All handler tests use Hono's built-in `app.request()` helper to exercise routes without a running server. External API calls are mocked via `vi.stubGlobal('fetch', ...)`, so the suite runs entirely offline and stays fast.

| Test file | What it covers |
|---|---|
| `src/common/helpers.test.ts` | `buildPosterUrl`, `parseJSON`, `tmdbFetch`, `jsonSuccess`, `jsonError` |
| `src/app.test.ts` | Health check, 404 fallback, missing-param validation, invalid-ID validation |
| `src/books/handler.test.ts` | ISBN lookup, 404, search, error paths, minimal book edge case, cover-ID fallback |
| `src/games/handler.test.ts` | Search, query, by-ID, limit option, 404, error paths, minimal game edge case |
| `src/manga/handler.test.ts` | Search, details with author lookup, limit/offset options, error paths, no-cover/no-relationship edge cases |
| `src/movies/handler.test.ts` | Query, search, by-ID, language/year options, 404, error paths, no-director/no-poster edge cases |
| `src/mtg/handler.test.ts` | Card search, set/number filters, Scryfall error/warning responses, double-faced cards, colorless cards, newline escaping |
| `src/music/handler.test.ts` | Artist, album, and track search, pagination/filter options, error paths |
| `src/pkm/handler.test.ts` | Card search, set filter, empty results, error paths, minimal card edge case, effect-as-description |
| `src/repos/handler.test.ts` | Search, query, 404, filter options, error paths, no-license/no-description edge case |
| `src/shows/handler.test.ts` | Query, search, by-ID, language/year options, 404, error paths, no-poster edge case |
| `src/yt/handler.test.ts` | Full URL, short URL, raw ID, extra query params, 404, error paths, thumbnail resolution fallback |
