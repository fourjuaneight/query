import {
  AuthorResponse,
  MangaResponse,
  MangaSearchResponse,
  MangaSearchResult,
  MangaSearchOptions,
} from './typings';

export interface MangaData {
  title: string;
  description: string;
  author: string;
  year: number;
  status: string;
  cover: string;
  url: string;
}

const API = 'https://api.mangadex.org';
const ASSETS = 'https://uploads.mangadex.org';

/**
 * Fetch manga author name by ID
 * DOCS: https://api.mangadex.org/docs/redoc.html#tag/Author/operation/get-author-id
 */
const getMangaAuthor = async (id: string): Promise<string> => {
  try {
    const request = await fetch(`${API}/author/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (request.status !== 200) {
      const errorResp = await request.text();

      throw `(fetch): ${request.status} - ${request.statusText} (${id}) - ${errorResp}`;
    }

    const response: AuthorResponse = await request.json();

    return response.data.attributes.name;
  } catch (error) {
    console.error(`(getMangaAuthor) - ${error}`);
    throw `(getMangaAuthor) - ${error}`;
  }
};

/**
 * Fetch detailed manga information by ID
 * DOCS: https://api.mangadex.org/docs/redoc.html#tag/Manga/operation/get-manga-id
 *
 * @param id - The MangaDex manga ID
 * @returns Detailed manga data including title, description, author, and cover
 */
export const getMangaDetails = async (id: string): Promise<MangaData> => {
  try {
    const request = await fetch(
      `${API}/manga/${id}?limit=100&includes%5B%5D=cover_art&includes%5B%5D=scanlation_group&order%5Bvolume%5D=desc&order%5Bchapter%5D=desc&offset=0&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&contentRating%5B%5D=pornographic&translatedLanguage%5B%5D=en`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (request.status !== 200) {
      const errorResp = await request.text();

      throw `(fetch): ${request.status} - ${request.statusText} (${id}) - ${errorResp}`;
    }

    const response: MangaResponse = await request.json();
    const {
      data: { attributes, relationships },
    } = response;
    const coverFile = relationships?.find(rel => rel.type === 'cover_art')
      ?.attributes?.fileName;
    const author = await getMangaAuthor(relationships[0].id);

    return {
      title: attributes.title.en,
      description: attributes.description.en,
      author,
      year: attributes.year,
      status: attributes.status,
      cover: `${ASSETS}/covers/${id}/${coverFile}`,
    };
  } catch (error) {
    console.error(`[getMangaDetails] - ${error}`);
    throw `[getMangaDetails] - ${error}`;
  }
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
  try {
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

    // Status filter
    if (options.status) {
      for (const status of options.status) {
        params.append('status[]', status);
      }
    }

    // Publication demographic filter
    if (options.publicationDemographic) {
      for (const demographic of options.publicationDemographic) {
        params.append('publicationDemographic[]', demographic);
      }
    }

    // Tag filters
    if (options.includedTags) {
      for (const tag of options.includedTags) {
        params.append('includedTags[]', tag);
      }
    }

    if (options.excludedTags) {
      for (const tag of options.excludedTags) {
        params.append('excludedTags[]', tag);
      }
    }

    // Order/sorting
    if (options.order) {
      for (const [key, value] of Object.entries(options.order)) {
        params.set(`order[${key}]`, value);
      }
    }

    const request = await fetch(`${API}/manga?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (request.status !== 200) {
      const errorResp = await request.text();

      throw `(fetch): ${request.status} - ${request.statusText} (${title}) - ${errorResp}`;
    }

    const response: MangaSearchResponse = await request.json();

    return response.data.map(manga => {
      const coverFile = manga.relationships?.find(
        rel => rel.type === 'cover_art',
      )?.attributes?.fileName;
      const author =
        manga.relationships?.find(rel => rel.type === 'author')?.attributes
          ?.name ?? '';

      return {
        title:
          manga.attributes.title.en ?? Object.values(manga.attributes.title)[0],
        description: manga.attributes.description?.en ?? '',
        author,
        year: manga.attributes.year,
        status: manga.attributes.status,
        cover: coverFile ? `${ASSETS}/covers/${manga.id}/${coverFile}` : null,
      };
    });
  } catch (error) {
    console.error(`[searchManga] - ${error}`);
    throw `[searchManga] - ${error}`;
  }
};
