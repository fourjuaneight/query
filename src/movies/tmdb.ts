import { buildPosterUrl, tmdbFetch } from '../common/helpers';
import type { TMDBQueryOptions } from '../common/typings';
import type {
  TMDBMovieSearchResponse,
  TMDBMovieDetails,
  MovieData,
  MovieSearchResponse,
} from './typings';

/**
 * Search for a movie by title
 * DOCS: https://developer.themoviedb.org/reference/search-movie
 */
const searchMovie = async (
  apiKey: string,
  query: string,
  options: TMDBQueryOptions = {},
): Promise<TMDBMovieSearchResponse> =>
  tmdbFetch<TMDBMovieSearchResponse>(apiKey, '/search/movie', {
    query,
    language: options.language ?? 'en-US',
    page: options.page ?? 1,
    year: options.year,
  });

/**
 * Get detailed movie information by ID (including credits)
 * DOCS: https://developer.themoviedb.org/reference/movie-details
 */
const getMovieDetails = async (
  apiKey: string,
  movieId: number,
  language = 'en-US',
): Promise<TMDBMovieDetails> =>
  tmdbFetch<TMDBMovieDetails>(apiKey, `/movie/${movieId}`, {
    language,
    append_to_response: 'credits',
  });

/**
 * Normalize TMDB movie details into a MovieData object
 */
const normalizeMovie = (details: TMDBMovieDetails): MovieData => ({
  title: details.title,
  releaseDate: details.release_date,
  director:
    details.credits?.crew.find(member => member.job === 'Director')?.name ??
    null,
  genres: details.genres.map(genre => genre.name),
  runtime: details.runtime,
  overview: details.overview,
  posterUrl: buildPosterUrl(details.poster_path),
});

/**
 * Query movie data by title
 * Returns: Title, Director, Release Date, Cast names, and more
 *
 * @param title - The movie title to search for
 * @param options - Optional query parameters (language, year)
 * @returns Normalized movie data or null if not found
 */
export const queryMovie = async (
  apiKey: string,
  title: string,
  options: TMDBQueryOptions = {},
): Promise<MovieData | null> => {
  const { results } = await searchMovie(apiKey, title, options);

  // Get the first (most relevant) result
  const [first] = results;
  if (!first) return null;

  return normalizeMovie(
    await getMovieDetails(apiKey, first.id, options.language),
  );
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
  apiKey: string,
  movieId: number,
  language = 'en-US',
): Promise<MovieData> =>
  normalizeMovie(await getMovieDetails(apiKey, movieId, language));

/**
 * Search movies and return multiple results
 * Useful when you want to let users pick from search results
 *
 * @param query - Search query
 * @param options - Query options including pagination
 * @returns Array of search results with basic info
 */
export const searchMovies = async (
  apiKey: string,
  query: string,
  options: TMDBQueryOptions = {},
): Promise<MovieSearchResponse> => {
  const response = await searchMovie(apiKey, query, options);

  const results = await Promise.all(
    response.results.map(async movie =>
      normalizeMovie(await getMovieDetails(apiKey, movie.id, options.language)),
    ),
  );

  return {
    results,
    totalResults: response.total_results,
    totalPages: response.total_pages,
    page: response.page,
  };
};
