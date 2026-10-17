import type {
  MangaData,
  MangaResponse,
  MangaSearchResponse,
  MangaSearchResult,
  MangaSearchOptions,
  MangaDetails,
} from './typings';
import { upstreamFetch } from '../common/helpers';

const API = 'https://api.mangadex.org';
const ASSETS = 'https://uploads.mangadex.org';

/**
 * Pick the English title, falling back to the first available language
 */
const pickTitle = (title: MangaData['attributes']['title']): string =>
  title.en ?? Object.values(title).find(Boolean) ?? '';

/**
 * Extract the author name and cover URL from expanded relationships
 */
const extractRelationships = (
  manga: MangaData,
): { author: string; cover: string | null } => {
  const coverFile = manga.relationships?.find(rel => rel.type === 'cover_art')
    ?.attributes?.fileName;
  const author =
    manga.relationships?.find(rel => rel.type === 'author')?.attributes?.name ??
    '';

  return {
    author,
    cover: coverFile ? `${ASSETS}/covers/${manga.id}/${coverFile}` : null,
  };
};

/**
 * Fetch detailed manga information by ID
 * DOCS: https://api.mangadex.org/docs/redoc.html#tag/Manga/operation/get-manga-id
 *
 * @param id - The MangaDex manga ID
 * @returns Detailed manga data including title, description, author, and cover
 */
export const getMangaDetails = async (id: string): Promise<MangaDetails> => {
  const params = new URLSearchParams();
  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');

  const { data } = await upstreamFetch<MangaResponse>(
    'MangaDex',
    `${API}/manga/${encodeURIComponent(id)}?${params.toString()}`,
  );
  const { author, cover } = extractRelationships(data);

  return {
    title: pickTitle(data.attributes.title),
    description: data.attributes.description.en ?? '',
    author,
    year: data.attributes.year,
    status: data.attributes.status,
    cover,
    url: `https://mangadex.org/title/${data.id}`,
  };
};

/**
 * Search for manga by title
 * DOCS: https://api.mangadex.org/docs/03-manga/search/
 *
 * @param title - The manga title to search for
 * @param options - Optional search parameters (limit, offset, contentRating, etc.)
 * @returns Array of search results with basic info
 */
export const searchManga = async (
  title: string,
  options: MangaSearchOptions = {},
): Promise<MangaSearchResult[]> => {
  const params = new URLSearchParams();
  params.set('title', title);
  params.set('limit', String(options.limit ?? 10));
  params.set('offset', String(options.offset ?? 0));

  // Include cover_art and author in relationships
  params.append('includes[]', 'cover_art');
  params.append('includes[]', 'author');

  // Content rating filter (default to safe and suggestive)
  const contentRatings = options.contentRating ?? ['safe', 'suggestive'];
  for (const rating of contentRatings) {
    params.append('contentRating[]', rating);
  }

  const arrayFilters = {
    'status[]': options.status,
    'publicationDemographic[]': options.publicationDemographic,
    'includedTags[]': options.includedTags,
    'excludedTags[]': options.excludedTags,
  };
  for (const [key, values] of Object.entries(arrayFilters)) {
    for (const value of values ?? []) {
      params.append(key, value);
    }
  }

  // Order/sorting
  for (const [key, value] of Object.entries(options.order ?? {})) {
    params.set(`order[${key}]`, value);
  }

  const response = await upstreamFetch<MangaSearchResponse>(
    'MangaDex',
    `${API}/manga?${params.toString()}`,
  );

  return response.data.map(manga => ({
    title: pickTitle(manga.attributes.title),
    description: manga.attributes.description?.en ?? '',
    ...extractRelationships(manga),
    year: manga.attributes.year,
    status: manga.attributes.status,
  }));
};
