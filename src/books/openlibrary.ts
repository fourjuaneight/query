import type {
  OpenLibraryReadResponse,
  OpenLibraryRecord,
  OpenLibrarySearchDoc,
  OpenLibrarySearchResponse,
  BookSearchOptions,
  BookSearchResult,
} from './typings';
import { buildUrl, upstreamFetch } from '../common/helpers';

const OPENLIBRARY_BASE_URL = 'https://openlibrary.org/api/volumes/brief';
const OPENLIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPENLIBRARY_COVERS_URL = 'https://covers.openlibrary.org/b';

/**
 * Build cover URL from ISBN
 * Sizes: S (small), M (medium), L (large)
 * DOCS: https://openlibrary.org/dev/docs/api/covers
 */
const buildCoverUrl = (
  isbn: string | null,
  size: 'S' | 'M' | 'L' = 'L',
): string | null => {
  return isbn ? `${OPENLIBRARY_COVERS_URL}/isbn/${isbn}-${size}.jpg` : null;
};

/**
 * Build cover URL from cover ID
 * Sizes: S (small), M (medium), L (large)
 */
const buildCoverUrlFromId = (
  coverId: number | undefined,
  size: 'S' | 'M' | 'L' = 'L',
): string | null =>
  coverId ? `${OPENLIBRARY_COVERS_URL}/id/${coverId}-${size}.jpg` : null;

/**
 * Extract the first record from the OpenLibrary response
 */
const extractFirstRecord = (
  response: OpenLibraryReadResponse,
): OpenLibraryRecord | null => {
  // Unknown identifiers return an empty object/array instead of `records`
  return Object.values(response.records ?? {})[0] ?? null;
};

/**
 * Normalize OpenLibrary record to BookSearchResult format
 */
const normalizeBookData = (record: OpenLibraryRecord): BookSearchResult => {
  const { data } = record;

  const isbn13 = data.identifiers.isbn_13?.[0] ?? null;
  const isbn10 = data.identifiers.isbn_10?.[0] ?? null;

  // Extract year from publish_date (e.g., "2025" or "August 2009")
  const yearMatch = data.publish_date?.match(/\d{4}/);
  const firstPublishYear = yearMatch ? parseInt(yearMatch[0], 10) : null;

  return {
    title: data.title,
    subtitle: data.subtitle ?? null,
    authors: data.authors?.map(author => author.name) ?? [],
    firstPublishYear,
    publishers: data.publishers?.map(publisher => publisher.name) ?? [],
    pageCount: data.number_of_pages ?? null,
    genre: data.subjects?.map(subject => subject.name).slice(0, 10) ?? [],
    isbn10,
    isbn13,
    coverUrl: buildCoverUrl(isbn13 ?? isbn10),
  };
};

/**
 * Normalize OpenLibrary search doc to BookSearchResult format
 */
const normalizeSearchDoc = (doc: OpenLibrarySearchDoc): BookSearchResult => ({
  title: doc.title,
  subtitle: doc.subtitle ?? null,
  authors: doc.author_name ?? [],
  firstPublishYear: doc.first_publish_year ?? null,
  publishers: doc.publisher?.slice(0, 5) ?? [],
  pageCount: doc.number_of_pages_median ?? null,
  genre: doc.subject?.slice(0, 10) ?? [],
  isbn10: doc.isbn?.find(i => i.length === 10) ?? null,
  isbn13: doc.isbn?.find(i => i.length === 13) ?? null,
  coverUrl: buildCoverUrlFromId(doc.cover_i),
});

/**
 * Query book data by ISBN
 * Returns: Title, Authors, Publish Year, Publishers, Page Count, Genre, and more
 *
 * @param isbn - The book ISBN (10 or 13 digit)
 * @returns Normalized book data or null if not found
 */
export const queryBookByISBN = async (
  isbn: string,
): Promise<BookSearchResult | null> => {
  // Remove any hyphens or spaces from ISBN
  const cleanIsbn = isbn.replace(/[-\s]/g, '');

  const response = await upstreamFetch<OpenLibraryReadResponse>(
    'OpenLibrary',
    `${OPENLIBRARY_BASE_URL}/isbn/${encodeURIComponent(cleanIsbn)}.json`,
  );

  const record = extractFirstRecord(response);
  return record ? normalizeBookData(record) : null;
};

/**
 * Search for books by title
 * Returns: List of matching books with basic info
 * DOCS: https://openlibrary.org/dev/docs/api/search
 *
 * @param title - The book title to search for
 * @param options - Optional query parameters (limit, page, language)
 * @returns Array of search results
 */
export const searchBooksByTitle = async (
  title: string,
  options: BookSearchOptions = {},
): Promise<BookSearchResult[]> => {
  const url = buildUrl(OPENLIBRARY_SEARCH_URL, {
    title,
    limit: options.limit ?? 10,
    fields:
      'title,subtitle,author_name,first_publish_year,publish_year,cover_i,isbn,publisher,subject,language,number_of_pages_median',
    page: options.page,
    lang: options.language,
  });

  const data = await upstreamFetch<OpenLibrarySearchResponse>(
    'OpenLibrary',
    url,
  );

  return data.docs.map(normalizeSearchDoc);
};
