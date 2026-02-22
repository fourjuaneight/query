import { buildPosterUrl, tmdbFetch } from '../common/helpers';
import type { TMDBQueryOptions } from '../common/typings';
import type {
  TMDBMovieSearchResponse,
  TMDBMovieDetails,
  MovieData,
  MovieSearchResponse,
} from './typings';

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
 * Query movie data by title
 * Returns: Title, Director, Release Date, Cast names, and more
 *
 * @param title - The movie title to search for
 * @param options - Optional query parameters (language, year)
 * @returns Normalized movie data or null if not found
 */
export const queryMovie = async (
  title: string,
  options: TMDBQueryOptions = {},
): Promise<MovieData | null> => {
  try {
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

    return {
      title: details.title,
      releaseDate: details.release_date,
      director,
      genres: details.genres.map(genre => genre.name),
      runtime: details.runtime,
      overview: details.overview,
      posterUrl: buildPosterUrl(details.poster_path),
    };
  } catch (error) {
    console.error(`[queryMovie] - ${error}`);
    throw `[queryMovie] - ${error}`;
  }
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
  try {
    const details = await getMovieDetails(movieId, language);

    const director =
      details.credits?.crew.find(member => member.job === 'Director')?.name ??
      null;

    return {
      title: details.title,
      releaseDate: details.release_date,
      director,
      genres: details.genres.map(genre => genre.name),
      runtime: details.runtime,
      overview: details.overview,
      posterUrl: buildPosterUrl(details.poster_path),
    };
  } catch (error) {
    console.error(`[queryMovieById] - ${error}`);
    throw `[queryMovieById] - ${error}`;
  }
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
): Promise<MovieSearchResponse> => {
  try {
    const response = await searchMovie(query, options);

    const results = await Promise.all(
      response.results.map(async movie => {
        const details = await getMovieDetails(movie.id, options.language);

        const director =
          details.credits?.crew.find(member => member.job === 'Director')
            ?.name ?? null;

        return {
          title: details.title,
          releaseDate: details.release_date,
          director,
          genres: details.genres.map(genre => genre.name),
          runtime: details.runtime,
          overview: details.overview,
          posterUrl: buildPosterUrl(details.poster_path),
        };
      }),
    );

    return {
      results,
      totalResults: response.total_results,
      totalPages: response.total_pages,
      page: response.page,
    };
  } catch (error) {
    console.error(`[searchMovies] - ${error}`);
    throw `[searchMovies] - ${error}`;
  }
};
