// IGDB API Types
// DOCS: https://api-docs.igdb.com

export interface IGDBCover {
  id: number;
  image_id: string;
  url: string;
  width?: number;
  height?: number;
}

export interface IGDBGenre {
  id: number;
  name: string;
}

export interface IGDBPlatform {
  id: number;
  name: string;
  abbreviation?: string;
}

export interface IGDBCompany {
  id: number;
  name: string;
}

export interface IGDBInvolvedCompany {
  id: number;
  company: IGDBCompany;
  developer: boolean;
  publisher: boolean;
}

export interface IGDBGameSearchResult {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  cover?: IGDBCover;
  genres?: IGDBGenre[];
  platforms?: IGDBPlatform[];
  involved_companies?: IGDBInvolvedCompany[];
  first_release_date?: number;
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  total_rating?: number;
}

// Normalized Output Types

export interface GameData {
  title: string;
  summary: string | null;
  releaseDate: string | null;
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  coverUrl: string | null;
  rating: number | null;
}

export interface IGDBQueryOptions {
  limit?: number;
}
