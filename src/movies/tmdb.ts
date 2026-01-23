import type {
  TMDBMovieSearchResponse,
  TMDBMovieDetails,
  TMDBTVSearchResponse,
  TMDBTVDetails,
  MovieData,
  TVShowData,
  TMDBQueryOptions,
} from './typings';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Get the TMDB API key from environment variables
 */
const getApiKey = (): string => {
  const key = process.env.TMDB_KEY;
  if (!key) {
    throw new Error('TMDB_KEY environment variable is not set');
  }
  return key;
};

/**
 * Build full poster URL from path
 */
const buildPosterUrl = (posterPath: string | null): string | null => {
  return posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;
};

/**
 * Make a request to the TMDB API
 */
const tmdbFetch = async <T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  const apiKey = getApiKey();
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
};

/**
 * Search for a movie by title and return the first result's ID
 * DOCS: https://developer.themoviedb.org/reference/search-movie
 */
const searchMovie = async (
  query: string,
  options: TMDBQueryOptions = {},
): Promise<TMDBMovieSearchResponse> => {
  return tmdbFetch<TMDBMovieSearchResponse>('/search/movie', {
    query,
    language: options.language ?? 'en-US',
    page: options.page ?? 1,
    ...(options.year && { year: options.year }),
  });
};

/**
 * Get detailed movie information by ID (including credits)
 * DOCS: https://developer.themoviedb.org/reference/movie-details
 */
const getMovieDetails = async (
  movieId: number,
  language = 'en-US',
): Promise<TMDBMovieDetails> => {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${movieId}`, {
    language,
    append_to_response: 'credits',
  });
};

/**
 * Search for a TV show by title
 * DOCS: https://developer.themoviedb.org/reference/search-tv
 */
const searchTVShow = async (
  query: string,
  options: TMDBQueryOptions = {},
): Promise<TMDBTVSearchResponse> => {
  return tmdbFetch<TMDBTVSearchResponse>('/search/tv', {
    query,
    language: options.language ?? 'en-US',
    page: options.page ?? 1,
    ...(options.year && { first_air_date_year: options.year }),
  });
};

/**
 * Get detailed TV show information by ID (including aggregate credits)
 * DOCS: https://developer.themoviedb.org/reference/tv-series-details
 */
const getTVShowDetails = async (
  seriesId: number,
  language = 'en-US',
): Promise<TMDBTVDetails> => {
  return tmdbFetch<TMDBTVDetails>(`/tv/${seriesId}`, {
    language,
    append_to_response: 'aggregate_credits',
  });
};

/**
 * Query movie data by title
 * Returns: Title, Director, Release Date, Cast names, and more
 *
 * @param title - The movie title to search for
 * @param options - Optional query parameters (language, year)
 * @returns Normalized movie data or null if not found
 *
 * @example
 * ```ts
 * const movie = await queryMovie("The Matrix", { year: 1999 });
 * console.log(movie?.director); // "Lana Wachowski"
 * ```
 */
export const queryMovie = async (
  title: string,
  options: TMDBQueryOptions = {},
): Promise<MovieData | null> => {
  // Search for the movie
  const searchResults = await searchMovie(title, options);

  if (searchResults.results.length === 0) {
    return null;
  }

  // Get the first (most relevant) result
  const movieId = searchResults.results[0].id;

  // Fetch detailed information with credits
  const details = await getMovieDetails(movieId, options.language);

  // Extract director from crew
  const director =
    details.credits?.crew.find(member => member.job === 'Director')?.name ??
    null;

  // Extract top cast members (limit to 10)
  const cast =
    details.credits?.cast.slice(0, 10).map(member => member.name) ?? [];

  return {
    id: details.id,
    title: details.title,
    releaseDate: details.release_date,
    director,
    cast,
    genres: details.genres.map(genre => genre.name),
    runtime: details.runtime,
    overview: details.overview,
    rating: details.vote_average,
    posterUrl: buildPosterUrl(details.poster_path),
  };
};

/**
 * Query movie data by TMDB ID
 * Use this when you already have the movie ID
 *
 * @param movieId - The TMDB movie ID
 * @param language - Optional language code (default: "en-US")
 * @returns Normalized movie data
 */
export const queryMovieById = async (
  movieId: number,
  language = 'en-US',
): Promise<MovieData> => {
  const details = await getMovieDetails(movieId, language);

  const director =
    details.credits?.crew.find(member => member.job === 'Director')?.name ??
    null;
  const cast =
    details.credits?.cast.slice(0, 10).map(member => member.name) ?? [];

  return {
    id: details.id,
    title: details.title,
    releaseDate: details.release_date,
    director,
    cast,
    genres: details.genres.map(genre => genre.name),
    runtime: details.runtime,
    overview: details.overview,
    rating: details.vote_average,
    posterUrl: buildPosterUrl(details.poster_path),
  };
};

/**
 * Query TV show data by title
 * Returns: Title, Creators, First Air Date, Season/Episode count, Cast names, and more
 *
 * @param title - The TV show title to search for
 * @param options - Optional query parameters (language, year)
 * @returns Normalized TV show data or null if not found
 *
 * @example
 * ```ts
 * const show = await queryTVShow("Breaking Bad");
 * console.log(show?.seasonCount); // 5
 * console.log(show?.episodeCount); // 62
 * ```
 */
export const queryTVShow = async (
  title: string,
  options: TMDBQueryOptions = {},
): Promise<TVShowData | null> => {
  // Search for the TV show
  const searchResults = await searchTVShow(title, options);

  if (searchResults.results.length === 0) {
    return null;
  }

  // Get the first (most relevant) result
  const seriesId = searchResults.results[0].id;

  // Fetch detailed information with aggregate credits
  const details = await getTVShowDetails(seriesId, options.language);

  // Extract creators
  const creators = details.created_by.map(creator => creator.name);

  // Extract top cast members (limit to 10)
  const cast =
    details.aggregate_credits?.cast.slice(0, 10).map(member => member.name) ??
    [];

  return {
    id: details.id,
    title: details.name,
    firstAirDate: details.first_air_date,
    lastAirDate: details.last_air_date,
    creators,
    cast,
    genres: details.genres.map(genre => genre.name),
    seasonCount: details.number_of_seasons,
    episodeCount: details.number_of_episodes,
    overview: details.overview,
    rating: details.vote_average,
    status: details.status,
    posterUrl: buildPosterUrl(details.poster_path),
  };
};

/**
 * Query TV show data by TMDB ID
 * Use this when you already have the series ID
 *
 * @param seriesId - The TMDB series ID
 * @param language - Optional language code (default: "en-US")
 * @returns Normalized TV show data
 */
export const queryTVShowById = async (
  seriesId: number,
  language = 'en-US',
): Promise<TVShowData> => {
  const details = await getTVShowDetails(seriesId, language);

  const creators = details.created_by.map(creator => creator.name);
  const cast =
    details.aggregate_credits?.cast.slice(0, 10).map(member => member.name) ??
    [];

  return {
    id: details.id,
    title: details.name,
    firstAirDate: details.first_air_date,
    lastAirDate: details.last_air_date,
    creators,
    cast,
    genres: details.genres.map(genre => genre.name),
    seasonCount: details.number_of_seasons,
    episodeCount: details.number_of_episodes,
    overview: details.overview,
    rating: details.vote_average,
    status: details.status,
    posterUrl: buildPosterUrl(details.poster_path),
  };
};

/**
 * Search movies and return multiple results
 * Useful when you want to let users pick from search results
 *
 * @param query - Search query
 * @param options - Query options including pagination
 * @returns Array of search results with basic info
 */
export const searchMovies = async (
  query: string,
  options: TMDBQueryOptions = {},
): Promise<{
  results: Array<{
    id: number;
    title: string;
    releaseDate: string;
    overview: string;
    posterUrl: string | null;
  }>;
  totalResults: number;
  totalPages: number;
  page: number;
}> => {
  const response = await searchMovie(query, options);

  return {
    results: response.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      overview: movie.overview,
      posterUrl: buildPosterUrl(movie.poster_path),
    })),
    totalResults: response.total_results,
    totalPages: response.total_pages,
    page: response.page,
  };
};

/**
 * Search TV shows and return multiple results
 * Useful when you want to let users pick from search results
 *
 * @param query - Search query
 * @param options - Query options including pagination
 * @returns Array of search results with basic info
 */
export const searchTVShows = async (
  query: string,
  options: TMDBQueryOptions = {},
): Promise<{
  results: Array<{
    id: number;
    title: string;
    firstAirDate: string;
    overview: string;
    posterUrl: string | null;
  }>;
  totalResults: number;
  totalPages: number;
  page: number;
}> => {
  const response = await searchTVShow(query, options);

  return {
    results: response.results.map(show => ({
      id: show.id,
      title: show.name,
      firstAirDate: show.first_air_date,
      overview: show.overview,
      posterUrl: buildPosterUrl(show.poster_path),
    })),
    totalResults: response.total_results,
    totalPages: response.total_pages,
    page: response.page,
  };
};
