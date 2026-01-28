import { buildPosterUrl, tmdbFetch } from '../common/helpers';
import type { TMDBQueryOptions } from '../common/typings';
import type {
  TMDBTVSearchResponse,
  TMDBTVDetails,
  TVShowData,
} from './typings';

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
 * Query TV show data by title
 * Returns: Title, Creators, First Air Date, Season/Episode count, Cast names, and more
 *
 * @param title - The TV show title to search for
 * @param options - Optional query parameters (language, year)
 * @returns Normalized TV show data or null if not found
 */
export const queryTVShow = async (
  title: string,
  options: TMDBQueryOptions = {},
): Promise<TVShowData | null> => {
  try {
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
  } catch (error) {
    console.log(`[queryTVShow] - ${error}`);
    throw `[queryTVShow] - ${error}`;
  }
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
  try {
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
  } catch (error) {
    console.log(`[queryTVShowById] - ${error}`);
    throw `[queryTVShowById] - ${error}`;
  }
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
  try {
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
  } catch (error) {
    console.log(`[searchTVShows] - ${error}`);
    throw `[searchTVShows] - ${error}`;
  }
};
