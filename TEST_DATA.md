# Example Queries

Sample `curl` commands for every endpoint. All examples assume the server is running locally on `http://localhost:8787`.

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

# Search albums with optional filters
curl "http://localhost:8787/music/albums?title=Random+Access+Memories&artist=Daft+Punk&year=2013&page=1&per_page=5"

# Search tracks
curl "http://localhost:8787/music/tracks?track=Paranoid+Android"

# Search tracks with optional filters
curl "http://localhost:8787/music/tracks?track=Lucky&artist=Daft+Punk&year=2013&page=1&per_page=5"
```

## Pokémon TCG

```sh
# Search for a card by name
curl "http://localhost:8787/pkm/cards?name=Charizard"

# Search with a specific set
curl "http://localhost:8787/pkm/cards?name=Pikachu&set=base1"
```

## Repos

```sh
# Search GitHub repositories
curl "http://localhost:8787/repos/search?query=hono"

# Search with optional filters
curl "http://localhost:8787/repos/search?query=typescript+framework&language=typescript&sort=stars&order=desc&page=1&per_page=5"

# Query a single repo by full name (owner/repo)
curl "http://localhost:8787/repos/query?name=honojs/hono"
```
