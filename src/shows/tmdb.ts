import { buildPosterUrl, tmdbFetch, tmdbGenres } from '../common/helpers';
import type { TMDBQueryOptions } from '../common/typings';
import type {
  TMDBTVSearchResponse,
  TMDBTVSearchResult,
  TMDBTVDetails,
  TVShowData,
  TVShowSearchResponse,
} from './typings';

/**
 * Search for a TV show by title
 * DOCS: https://developer.themoviedb.org/reference/search-tv
 */
const searchTVShow = async (
  apiKey: string,
  query: string,
  options: TMDBQueryOptions = {},
): Promise<TMDBTVSearchResponse> =>
  tmdbFetch<TMDBTVSearchResponse>(apiKey, '/search/tv', {
    query,
    language: options.language ?? 'en-US',
    page: options.page ?? 1,
    first_air_date_year: options.year,
  });

/**
 * Get detailed TV show information by ID (including aggregate credits)
 * DOCS: https://developer.themoviedb.org/reference/tv-series-details
 */
const getTVShowDetails = async (
  apiKey: string,
  seriesId: number,
  language = 'en-US',
): Promise<TMDBTVDetails> =>
  tmdbFetch<TMDBTVDetails>(apiKey, `/tv/${seriesId}`, {
    language,
    append_to_response: 'aggregate_credits',
  });

/**
 * Normalize TMDB TV show details into a TVShowData object
 */
const normalizeTVShow = (details: TMDBTVDetails): TVShowData => ({
  id: details.id,
  title: details.name,
  firstAirDate: details.first_air_date,
  lastAirDate: details.last_air_date,
  creators: details.created_by.map(creator => creator.name),
  genres: details.genres.map(genre => genre.name),
  seasonCount: details.number_of_seasons,
  episodeCount: details.number_of_episodes,
  overview: details.overview,
  status: details.status,
  posterUrl: buildPosterUrl(details.poster_path),
});

/**
 * Normalize a TMDB search result into a TVShowData object without details
 */
const normalizeSearchResult = (
  show: TMDBTVSearchResult,
  genres: Map<number, string>,
): TVShowData => ({
  id: show.id,
  title: show.name,
  firstAirDate: show.first_air_date,
  lastAirDate: null,
  creators: [],
  genres: (show.genre_ids ?? []).flatMap(id => genres.get(id) ?? []),
  seasonCount: null,
  episodeCount: null,
  overview: show.overview,
  status: null,
  posterUrl: buildPosterUrl(show.poster_path),
});

/**
 * Query TV show data by title
 * Returns: Title, Creators, First Air Date, Season/Episode count, Cast names, and more
 *
 * @param title - The TV show title to search for
 * @param options - Optional query parameters (language, year)
 * @returns Normalized TV show data or null if not found
 */
export const queryTVShow = async (
  apiKey: string,
  title: string,
  options: TMDBQueryOptions = {},
): Promise<TVShowData | null> => {
  const { results } = await searchTVShow(apiKey, title, options);

  // Get the first (most relevant) result
  const [first] = results;
  if (!first) return null;

  return normalizeTVShow(
    await getTVShowDetails(apiKey, first.id, options.language),
  );
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
  apiKey: string,
  seriesId: number,
  language = 'en-US',
): Promise<TVShowData> =>
  normalizeTVShow(await getTVShowDetails(apiKey, seriesId, language));

/**
 * Search TV shows and return multiple results
 * Useful when you want to let users pick from search results.
 * With `details: false`, skips the per-result details request
 * (creators, counts, and status are empty) and makes 2 requests instead of 21.
 *
 * @param query - Search query
 * @param options - Query options including pagination
 * @returns Array of search results with basic info
 */
export const searchTVShows = async (
  apiKey: string,
  query: string,
  options: TMDBQueryOptions = {},
): Promise<TVShowSearchResponse> => {
  const response = await searchTVShow(apiKey, query, options);

  let results: TVShowData[];
  if (options.details === false) {
    const genres = await tmdbGenres(apiKey, 'tv', options.language);
    results = response.results.map(show => normalizeSearchResult(show, genres));
  } else {
    results = await Promise.all(
      response.results.map(async show =>
        normalizeTVShow(
          await getTVShowDetails(apiKey, show.id, options.language),
        ),
      ),
    );
  }

  return {
    results,
    totalResults: response.total_results,
    totalPages: response.total_pages,
    page: response.page,
  };
};
