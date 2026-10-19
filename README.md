# Query

Wrappers around frequently used 3rd-party APIs.

## Overview

Query is a lightweight API aggregation service that wraps commonly used (for me) 3rd-party APIs behind a single, consistent interface. Each API module lives in its own directory under `src/` with a clear separation of concerns:

- **API client** (e.g. `openlibrary.ts`, `igdb.ts`) — handles authentication, fetching, and data normalization.
- **Handler** (`handler.ts`) — validates incoming request parameters and returns standardized JSON responses.
- **Types** (`typings.d.ts`) — TypeScript type definitions for both raw API responses and normalized output.
- **MCP tools** (`tools.ts`) — exposes the same API client calls as read-only [MCP](https://modelcontextprotocol.io) tools (see [MCP server](#mcp-server)).

The Worker entry is [`src/worker.ts`](src/worker.ts). It serves the REST API, the MCP endpoint and the OAuth endpoints from one Worker. REST routes are registered in [`src/app.ts`](src/app.ts) using [Hono](https://hono.dev), a small, fast web framework designed for edge runtimes. Hono was chosen because it runs natively on Cloudflare Workers with zero additional adapters, has a familiar Express-like API, and adds virtually no overhead.

All responses follow a uniform shape:

```json
{ "success": true, "data": { ... } }
```

or on error:

```json
{ "success": false, "error": "..." }
```

Error status codes:

| Status | Meaning |
|---|---|
| `400` | Missing or invalid parameter (e.g. `limit=abc`, `sort=popular`) |
| `401` | Missing or wrong API key (only when `API_KEY` is set) |
| `404` | Nothing found, or the upstream service has no such resource |
| `429` | Rate limit exceeded (ours or the upstream service's) |
| `502` | The upstream service failed; details are logged, not returned |
| `500` | Unexpected internal error |

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

### Access control

| Variable / binding | Purpose |
|---|---|
| `API_KEY` (optional secret) | When set, every REST route except `/` requires `Authorization: Bearer <API_KEY>`. When unset, the REST API is open. It is also the owner password for MCP sign-in. When unset, the MCP server and its OAuth endpoints answer `503`. Use a long random value. |
| `RATE_LIMITER` (binding in [`wrangler.toml`](wrangler.toml)) | Per-IP limit of 60 requests per 60 seconds for REST, `/mcp`, the `/authorize` sign-in page and the `/oauth/*` endpoints. Remove the `[[ratelimits]]` block to disable. This also removes the only throttle on sign-in password guesses. |
| `OAUTH_KV` (binding in [`wrangler.toml`](wrangler.toml)) | KV namespace for MCP OAuth clients, grants and tokens. Wrangler creates it on the first deploy. |

Successful `GET` responses are cached for one hour (`Cache-Control: max-age=3600`) using the Workers Cache API. Cloudflare documents the Cache API as functional on custom domains.

## Install

**Prerequisites:** Node.js 26 (see [`.nvmrc`](.nvmrc)) and [pnpm](https://pnpm.io/) 12. pnpm switches to the version pinned in `package.json` (`packageManager`) automatically.

```sh
# Clone the repository
git clone https://github.com/fourjuaneight/query.git
cd query

# Install dependencies
pnpm install

# Start the local development server (uses Wrangler; REST, MCP and OAuth)
pnpm dev

# Same, over HTTPS on localhost (needed for MCP sign-in in Safari)
pnpm dev:https

# Or run locally with Node via tsx (REST API only, no MCP)
pnpm dev:local
```

For `pnpm dev`, put the API credentials and `API_KEY` in a `.dev.vars` file (git-ignored). Wrangler reads `.env` only when there is no `.dev.vars`, so keep all variables in one file. `pnpm dev:local` reads `.env`.

For more on Hono's API and features, see the [Hono documentation](https://hono.dev/docs/).

## Usage

All endpoints accept `GET` requests with query parameters. Below is the full route reference:

### Books

| Endpoint | Parameters | Description |
|---|---|---|
| `/books/isbn` | `isbn` (required) | Look up a book by ISBN |
| `/books/search` | `title` (required), `limit` (max 100), `page`, `language` | Search books by title |

### Games

| Endpoint | Parameters | Description |
|---|---|---|
| `/games/search` | `query` (required), `limit` (max 500) | Search games |
| `/games/query` | `title` (required) | Query a single game by title |
| `/games/:id` | `:id` (path) | Get a game by IGDB ID |

### Manga

| Endpoint | Parameters | Description |
|---|---|---|
| `/manga/search` | `title` (required), `limit` (max 100), `offset` | Search manga by title |
| `/manga/:id` | `:id` (path, UUID) | Get manga details by MangaDex ID |

### Movies

| Endpoint | Parameters | Description |
|---|---|---|
| `/movies/query` | `title` (required), `language`, `year` | Query a single movie by title |
| `/movies/search` | `query` (required), `language`, `year`, `page`, `details` | Search movies. `details=false` skips the per-result details request (`director` and `runtime` are `null`) |
| `/movies/:id` | `:id` (path), `language` | Get a movie by TMDB ID |

### MTG Cards

| Endpoint | Parameters | Description |
|---|---|---|
| `/mtg/cards` | `name` (required), `set`, `number` | Search Magic: The Gathering cards (empty array when nothing matches) |

### Music

| Endpoint | Parameters | Description |
|---|---|---|
| `/music/artists` | `name` (required), `page`, `per_page` (max 100) | Search artists on Discogs |
| `/music/albums` | `title` (required), `artist`, `year`, `genre`, `page`, `per_page` (max 100) | Search albums |
| `/music/tracks` | `track` (required), `artist`, `year`, `genre`, `page`, `per_page` (max 100) | Search tracks |

### Pokémon TCG

| Endpoint | Parameters | Description |
|---|---|---|
| `/pkm/cards` | `name` (required), `set`, `limit` (default 20, max 40), `page` | Search Pokémon TCG cards |

### Repos

| Endpoint | Parameters | Description |
|---|---|---|
| `/repos/search` | `query` (required), `language`, `sort` (`stars` default, `best-match`, `forks`, `help-wanted-issues`, `updated`), `order` (`asc`, `desc`), `page`, `per_page` (max 100) | Search GitHub repositories |
| `/repos/query` | `name` (required) | Get a repo by `owner/repo`, or the best search match for a bare name |

### TV Shows

| Endpoint | Parameters | Description |
|---|---|---|
| `/shows/query` | `title` (required), `language`, `year` | Query a single TV show by title |
| `/shows/search` | `query` (required), `language`, `year`, `page`, `details` | Search TV shows. `details=false` skips the per-result details request |
| `/shows/:id` | `:id` (path), `language` | Get a TV show by TMDB ID |

### YouTube

| Endpoint | Parameters | Description |
|---|---|---|
| `/yt/video` | `url` (required) | Get video details by YouTube URL (`youtu.be`, `watch`, `shorts`, `embed`, `live`) or video ID |

### Example

If `API_KEY` is set, add `-H "Authorization: Bearer $API_KEY"` to each request.

```sh
# Search for a book
curl "http://localhost:8787/books/search?title=Dune&limit=5"

# Look up a YouTube video
curl "http://localhost:8787/yt/video?url=https://youtu.be/YQWLndmkofU"

# Look up an MTG card
curl "http://localhost:8787/mtg/cards?name=Black+Lotus"
```

## MCP server

The Worker is also a remote [Model Context Protocol](https://modelcontextprotocol.io) server at `/mcp`, so Claude (and other MCP clients) can use every API as a tool.

- **Transport:** Streamable HTTP, stateless. It serves the `2026-07-28` protocol and falls back to `2025-*` clients ([`@modelcontextprotocol/server`](https://www.npmjs.com/package/@modelcontextprotocol/server)).
- **Auth:** OAuth 2.1 with PKCE ([`@cloudflare/workers-oauth-provider`](https://github.com/cloudflare/workers-oauth-provider)). Clients register with Client ID Metadata Documents or Dynamic Client Registration. The `/authorize` consent page asks for the owner password, which is the `API_KEY` secret.
- **Tools:** 21 read-only tools, one per REST route. Results are JSON text. Errors come back as tool errors. Not-found and upstream errors use the same messages as the REST API. Invalid arguments return the MCP SDK's validation message.

| Tool | REST route |
|---|---|
| `get_book_by_isbn`, `search_books` | `/books/isbn`, `/books/search` |
| `search_games`, `find_game`, `get_game` | `/games/search`, `/games/query`, `/games/:id` |
| `search_manga`, `get_manga` | `/manga/search`, `/manga/:id` |
| `find_movie`, `search_movies`, `get_movie` | `/movies/query`, `/movies/search`, `/movies/:id` |
| `find_tv_show`, `search_tv_shows`, `get_tv_show` | `/shows/query`, `/shows/search`, `/shows/:id` |
| `get_mtg_card` | `/mtg/cards` |
| `get_pokemon_card` | `/pkm/cards` |
| `search_music_artists`, `search_music_albums`, `search_music_tracks` | `/music/artists`, `/music/albums`, `/music/tracks` |
| `search_repos`, `get_repo` | `/repos/search`, `/repos/query` |
| `get_youtube_video` | `/yt/video` |

Tool parameters match the REST query parameters, except that `per_page` is `perPage`, `:id` path segments are an `id` argument, and numbers and booleans are JSON values (`5`, `false`), not strings. Search results from `search_games` and `search_manga` include the `id` that `get_game` and `get_manga` take.

### Connect Claude

- **claude.ai (web, desktop and mobile):** Settings → Connectors → Add custom connector. Enter `https://<your-worker>/mcp`, then sign in with the `API_KEY` password when asked.
- **Claude Code:** `claude mcp add --transport http query https://<your-worker>/mcp`, then run `/mcp` in Claude Code to sign in.
- **MCP Inspector (local testing):** `npx @modelcontextprotocol/inspector`, then connect to `http://localhost:8787/mcp` (Streamable HTTP). Safari does not keep the sign-in cookie on plain `http://localhost`: in Safari, run `pnpm dev:https`, accept the self-signed certificate once at `https://localhost:8787/`, and connect to `https://localhost:8787/mcp`. Chrome and Firefox work with plain `pnpm dev`.

The server works on every hostname the Worker serves (`workers.dev`, a custom domain, `localhost`). Each hostname issues its own tokens, so keep using the URL you signed in with.

A sign-in lasts while it is used. It expires after 30 days without use, and the client then asks you to sign in again. Changing or removing `API_KEY` signs out every connected client.

## Deployment

This project is configured to deploy to [Cloudflare Workers](https://developers.cloudflare.com/workers/) via [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/). The configuration lives in [`wrangler.toml`](wrangler.toml).

```sh
# Deploy to Cloudflare Workers (Wrangler bundles src/worker.ts)
pnpm run deploy
```

Use `pnpm run deploy`, not `pnpm deploy`: `pnpm deploy` is a built-in pnpm command. The CI workflow ([`.github/workflows/worker.yml`](.github/workflows/worker.yml)) also deploys on every push to `main`.

The `OAUTH_KV` binding in [`wrangler.toml`](wrangler.toml) has no `id`. On the first deploy, Wrangler creates the namespace and binds it, and later deploys reuse it. The Cloudflare API token (`CF_API_TOKEN` in CI) needs the **Workers KV Storage: Edit** permission for this. To use an existing namespace instead, add its `id` to the binding.

CI only deploys; it does not upload secrets. Set each secret once in the Cloudflare dashboard or with the Wrangler CLI. Secrets stay in place across deploys, so run `wrangler secret put <NAME>` again only to change one:

```sh
wrangler secret put TMDB_KEY
wrangler secret put TWITCH_CLIENT_ID
wrangler secret put TWITCH_CLIENT_SECRET
wrangler secret put DISCOGS_TOKEN
wrangler secret put GH_TOKEN
wrangler secret put YOUTUBE_KEY

# Bearer token for the REST API and owner password for MCP sign-in
wrangler secret put API_KEY
```

For more details, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).

## Testing

Tests are written with [Vitest](https://vitest.dev/) and live alongside their source files as `*.test.ts`. Every handler, MCP tool and shared helper has coverage.

```sh
# Run the full test suite
pnpm test

# Run in watch mode during development
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Typecheck worker code (no Node types) and Node-side code (server, tests)
pnpm typecheck
```

A Husky pre-commit hook runs Prettier and ESLint on staged files. It installs with `pnpm install`.

The OAuth library imports `cloudflare:workers`. Under Vitest this module is aliased to a small stub ([`src/test/cloudflare-workers.ts`](src/test/cloudflare-workers.ts)), so the Worker entry runs under Node.

All handler tests use Hono's built-in `app.request()` helper to exercise routes without a running server. External API calls are mocked via `vi.stubGlobal('fetch', ...)`, so the suite runs entirely offline and stays fast.

| Test file | What it covers |
|---|---|
| `src/common/helpers.test.ts` | `buildPosterUrl`, `buildUrl`, `parseJSON`, `upstreamFetch`, `tmdbFetch`, `jsonSuccess`, `jsonError`, `errorResponse` status mapping |
| `src/common/params.test.ts` | Required/optional/integer/enum/boolean query params, path IDs |
| `src/app.test.ts` | Health check, 404 fallback, missing-param validation, invalid-ID validation, API key auth, rate limiting |
| `src/books/handler.test.ts` | ISBN lookup, 404, search, error paths, minimal book edge case, cover-ID fallback |
| `src/games/handler.test.ts` | Search, query, by-ID, limit option, 404, error paths, minimal game edge case |
| `src/games/igdb.test.ts` | Query escaping, shared token request, 401 refresh-and-retry |
| `src/manga/handler.test.ts` | Search, single-request details, UUID validation, 404, limit/offset options, error paths, no-cover/no-relationship edge cases |
| `src/movies/handler.test.ts` | Query, search, by-ID, language/year options, `details=false`, 404, error paths, no-director/no-poster edge cases |
| `src/mtg/handler.test.ts` | Card search, set/number filters, request headers, no-match (404) and rejected-query (400) responses, double-faced cards, colorless cards, newline escaping |
| `src/music/handler.test.ts` | Artist, album, and track search, pagination/filter options, error paths |
| `src/pkm/handler.test.ts` | Card search, set filter, limit/page, empty results, error paths, minimal card edge case, effect-as-description |
| `src/repos/handler.test.ts` | Search, query, `owner/repo` lookup, best-match ranking, `totalPages`, param validation, 404, error paths, no-license/no-description edge case |
| `src/shows/handler.test.ts` | Query, search, by-ID, language/year options, 404, error paths, no-poster edge case |
| `src/yt/handler.test.ts` | Full URL, short URL, share link, raw ID, extra query params, invalid input, 404, error paths, thumbnail resolution fallback |
| `src/yt/youtube.test.ts` | Video ID extraction across URL formats |
| `src/mcp/server.test.ts` | Tool list and annotations, each tool reaches its service, argument forwarding, `details: false`, IDs in search results, JSON results, not-found and upstream error mapping, input validation |
| `src/worker.test.ts` | REST auth through the Worker entry, MCP off without `API_KEY`, OAuth discovery per origin, CIMD, rate limiting, consent page (escaping, deny, wrong password, cookie and handle checks, error pages), PKCE token exchange, refresh, single-use codes, legacy and 2026-07-28 MCP clients, `/mcp/`, batch rejection, sign-out on `API_KEY` change |
