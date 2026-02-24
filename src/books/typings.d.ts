// OpenLibrary API Types
export interface OpenLibraryAuthor {
  url: string;
  name: string;
}

export interface OpenLibraryPublisher {
  name: string;
}

export interface OpenLibrarySubject {
  name: string;
  url: string;
}

export interface OpenLibraryLink {
  title: string;
  url: string;
}

export interface OpenLibraryIdentifiers {
  isbn_10?: string[];
  isbn_13?: string[];
  openlibrary?: string[];
  goodreads?: string[];
  librarything?: string[];
}

export interface OpenLibraryCover {
  small?: string;
  medium?: string;
  large?: string;
}

export interface OpenLibraryData {
  url: string;
  key: string;
  title: string;
  subtitle?: string;
  authors?: OpenLibraryAuthor[];
  number_of_pages?: number;
  weight?: string;
  identifiers: OpenLibraryIdentifiers;
  publishers?: OpenLibraryPublisher[];
  publish_date?: string;
  subjects?: OpenLibrarySubject[];
  subject_places?: OpenLibrarySubject[];
  subject_people?: OpenLibrarySubject[];
  links?: OpenLibraryLink[];
  cover?: OpenLibraryCover;
}

export interface OpenLibraryDetails {
  bib_key: string;
  info_url: string;
  preview: string;
  preview_url: string;
  details: {
    type: { key: string };
    authors?: Array<{ key: string; name: string }>;
    isbn_10?: string[];
    isbn_13?: string[];
    languages?: Array<{ key: string }>;
    number_of_pages?: number;
    publish_date?: string;
    publishers?: string[];
    source_records?: string[];
    title: string;
    subtitle?: string;
    full_title?: string;
    weight?: string;
    works?: Array<{ key: string }>;
    key: string;
    latest_revision?: number;
    revision?: number;
    created?: { type: string; value: string };
    last_modified?: { type: string; value: string };
  };
}

export interface OpenLibraryRecord {
  isbns: string[];
  issns: string[];
  lccns: string[];
  oclcs: string[];
  olids: string[];
  publishDates: string[];
  recordURL: string;
  data: OpenLibraryData;
  details: OpenLibraryDetails;
}

export interface OpenLibraryItem {
  match: 'exact' | 'similar';
  status: 'full access' | 'lendable' | 'checked out' | 'restricted';
  itemURL: string;
  cover?: OpenLibraryCover;
  fromRecord: string;
  publishDate?: string;
  'ol-edition-id': string;
  'ol-work-id': string;
}

export interface OpenLibraryReadResponse {
  records: Record<string, OpenLibraryRecord>;
  items: OpenLibraryItem[];
}

// Normalized Output Types
export interface BookSearchResult {
  title: string;
  subtitle: string | null;
  authors: string[];
  firstPublishYear: number | null;
  publishers: string[];
  pageCount: number | null;
  genre?: string[];
  isbn10: string | null;
  isbn13: string | null;
  coverUrl: string | null;
}

// Search API Types
export interface OpenLibrarySearchDoc {
  key?: string;
  title: string;
  subtitle?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  publish_year?: number[];
  edition_count?: number;
  cover_i?: number;
  cover_edition_key?: string;
  isbn?: string[];
  publisher?: string[];
  subject?: string[];
  language?: string[];
  has_fulltext?: boolean;
  public_scan_b?: boolean;
  ia?: string[];
  number_of_pages_median?: number;
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  num_found: number;
  documentation_url: string;
  q: string;
  offset: number | null;
  docs: OpenLibrarySearchDoc[];
}

export interface BookSearchResponse {
  totalResults: number;
  start: number;
  results: BookSearchResult[];
}

export interface BookSearchOptions {
  limit?: number;
  page?: number;
  language?: string;
}
