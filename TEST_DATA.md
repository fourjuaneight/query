# Example Queries

Sample `curl` commands for every endpoint. All examples assume the server is running locally on `http://localhost:8787`.

If `API_KEY` is set, add the bearer token to every request except the health check:

```sh
curl -H "Authorization: Bearer $API_KEY" "http://localhost:8787/books/search?title=Dune"
```

## Health Check

```sh
curl "http://localhost:8787/"
```

## Books

```sh
# Look up a book by ISBN
curl "http://localhost:8787/books/isbn?isbn=9780441013593"

# Search books by title
curl "http://localhost:8787/books/search?title=Dune"

# Search with optional params
curl "http://localhost:8787/books/search?title=Neuromancer&limit=5&page=1&language=eng"
```

## Games

```sh
# Search games
curl "http://localhost:8787/games/search?query=zelda"

# Search games with a limit
curl "http://localhost:8787/games/search?query=final+fantasy&limit=5"

# Query a single game by title
curl "http://localhost:8787/games/query?title=Hades"

# Get a game by IGDB ID
curl "http://localhost:8787/games/119171"
```

## Manga

```sh
# Search manga by title
curl "http://localhost:8787/manga/search?title=Berserk"

# Search with optional params
curl "http://localhost:8787/manga/search?title=Naruto&limit=5&offset=0"

# Get manga details by MangaDex ID
curl "http://localhost:8787/manga/801513ba-a712-498c-8f57-cae55b38cc92"
```

## Movies

```sh
# Query a single movie by title
curl "http://localhost:8787/movies/query?title=Blade+Runner"

# Query with optional params
curl "http://localhost:8787/movies/query?title=Dune&language=en-US&year=2021"

# Search movies
curl "http://localhost:8787/movies/search?query=interstellar"

# Search with optional params
curl "http://localhost:8787/movies/search?query=batman&language=en-US&year=2022&page=1"

# Search without per-result details (2 upstream requests instead of 21; director and runtime are null)
curl "http://localhost:8787/movies/search?query=batman&details=false"

# Get a movie by TMDB ID
curl "http://localhost:8787/movies/550"

# Get a movie by TMDB ID with language
curl "http://localhost:8787/movies/550?language=en-US"
```

## TV Shows

```sh
# Query a single TV show by title
curl "http://localhost:8787/shows/query?title=Breaking+Bad"

# Query with optional params
curl "http://localhost:8787/shows/query?title=Dark&language=de-DE&year=2017"

# Search TV shows
curl "http://localhost:8787/shows/search?query=the+wire"

# Search with optional params
curl "http://localhost:8787/shows/search?query=stranger+things&language=en-US&year=2016&page=1"

# Search without per-result details (creators, counts, and status are empty)
curl "http://localhost:8787/shows/search?query=the+wire&details=false"

# Get a TV show by TMDB ID
curl "http://localhost:8787/shows/1396"

# Get a TV show by TMDB ID with language
curl "http://localhost:8787/shows/1396?language=en-US"
```


## MTG Cards

```sh
# Search for a card by name
curl "http://localhost:8787/mtg/cards?name=Black+Lotus"

# Search with set and collector number
curl "http://localhost:8787/mtg/cards?name=Lightning+Bolt&set=2ed&number=162"
```

## Music

```sh
# Search artists
curl "http://localhost:8787/music/artists?name=Radiohead"

# Search artists with pagination
curl "http://localhost:8787/music/artists?name=Daft+Punk&page=1&per_page=5"

# Search albums
curl "http://localhost:8787/music/albums?title=OK+Computer"

# Search albums by artist, with pagination
curl "http://localhost:8787/music/albums?title=Random+Access+Memories&artist=Daft+Punk&page=1&per_page=5"

# Search albums without details (one request instead of one per album)
curl "http://localhost:8787/music/albums?title=OK+Computer&details=false"

# Search tracks
curl "http://localhost:8787/music/tracks?track=Paranoid+Android"

# Search tracks by artist, with pagination
curl "http://localhost:8787/music/tracks?track=Lucky&artist=Daft+Punk&page=1&per_page=5"
```

## Qobuz

```sh
# Search albums (store links default to the US store)
curl "http://localhost:8787/qobuz/albums?title=OK+Computer"

# Narrow by artist and get UK store links
curl "http://localhost:8787/qobuz/albums?title=Discovery&artist=Daft+Punk&store=gb-en&limit=5&offset=0"

# Store links only, without track lists (one request instead of one per album)
curl "http://localhost:8787/qobuz/albums?title=OK+Computer&tracks=false"
```

## Pokémon TCG

```sh
# Search for a card by name
curl "http://localhost:8787/pkm/cards?name=Charizard"

# Search with a specific set
curl "http://localhost:8787/pkm/cards?name=Pikachu&set=base1"

# Paginate large result sets (default limit 20, max 40)
curl "http://localhost:8787/pkm/cards?name=Pikachu&limit=10&page=2"
```

## Repos

```sh
# Search GitHub repositories
curl "http://localhost:8787/repos/search?query=hono"

# Search with optional filters
curl "http://localhost:8787/repos/search?query=typescript+framework&language=typescript&sort=stars&order=desc&page=1&per_page=5"

# Search ranked by relevance instead of stars
curl "http://localhost:8787/repos/search?query=edge+web+framework&sort=best-match"

# Query a single repo by full name (owner/repo), fetched directly
curl "http://localhost:8787/repos/query?name=honojs/hono"

# Query by bare name (returns the best search match)
curl "http://localhost:8787/repos/query?name=hono"
```

## YouTube

```sh
# Get video details by URL
curl "http://localhost:8787/yt/video?url=https://youtu.be/DeGFRB0Mor8"

# Get video details by full URL
curl "http://localhost:8787/yt/video?url=https://www.youtube.com/watch?v=DeGFRB0Mor8"

# Get video details by share link (URL-encode it so ?si= stays part of the url param)
curl "http://localhost:8787/yt/video?url=https%3A%2F%2Fyoutu.be%2FDeGFRB0Mor8%3Fsi%3Dabc123"

# Get video details by Shorts URL
curl "http://localhost:8787/yt/video?url=https://www.youtube.com/shorts/DeGFRB0Mor8"

# Get video details by video ID
curl "http://localhost:8787/yt/video?url=DeGFRB0Mor8"
```

## MCP

The MCP endpoint needs an OAuth token, so test it with an MCP client instead of `curl`. Start `pnpm dev` with `API_KEY` (and the API credentials) in `.dev.vars`, then run `npx @modelcontextprotocol/inspector`, connect to `http://localhost:8787/mcp` and sign in with the `API_KEY` password. In Safari, run `pnpm dev:https` instead and use `https://localhost:8787/mcp` (accept the self-signed certificate at `https://localhost:8787/` first); Safari drops the sign-in cookie on plain `http://localhost`.

```sh
# Check the OAuth discovery documents and the 401 challenge
curl "http://localhost:8787/.well-known/oauth-protected-resource/mcp"
curl "http://localhost:8787/.well-known/oauth-authorization-server"
curl -i -X POST "http://localhost:8787/mcp"
```

Sample tool calls (tool name and arguments, as entered in the Inspector or sent by Claude):

```jsonc
// Books
{ "name": "get_book_by_isbn", "arguments": { "isbn": "9780441013593" } }
{ "name": "search_books", "arguments": { "title": "Neuromancer", "limit": 5 } }

// Games
{ "name": "find_game", "arguments": { "title": "Hades" } }
{ "name": "get_game", "arguments": { "id": 1942 } }  // the id comes from search_games or find_game

// Manga
{ "name": "search_manga", "arguments": { "title": "Berserk", "limit": 3 } }

// Movies and TV shows
{ "name": "search_movies", "arguments": { "query": "Alien", "year": 1979, "details": false } }
{ "name": "get_tv_show", "arguments": { "id": 95396 } }

// Cards
{ "name": "get_mtg_card", "arguments": { "name": "Black Lotus" } }
{ "name": "get_pokemon_card", "arguments": { "name": "Pikachu", "limit": 5 } }

// Music
{ "name": "search_music_albums", "arguments": { "title": "Moving Pictures", "artist": "Rush", "perPage": 5 } }

// Repos
{ "name": "search_repos", "arguments": { "query": "hono", "sort": "stars", "perPage": 5 } }
{ "name": "get_repo", "arguments": { "name": "honojs/hono" } }

// YouTube
{ "name": "get_youtube_video", "arguments": { "url": "https://youtu.be/DeGFRB0Mor8" } }
```
