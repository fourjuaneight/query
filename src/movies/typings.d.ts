import { Genre } from '../common/typings';

// Common
export interface CastMember {
  id: number;
  name: string;
  character: string;
  order: number;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

// Movie Types
export interface TMDBMovieSearchResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBMovieSearchResponse {
  page: number;
  results: TMDBMovieSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  runtime: number;
  genres: Genre[];
  poster_path: string | null;
  backdrop_path: string | null;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  vote_average: number;
  vote_count: number;
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
}

// Normalized Output Types
export interface MovieData {
  id: number;
  title: string;
  releaseDate: string;
  director: string | null;
  cast: string[];
  genres: string[];
  runtime: number;
  overview: string;
  rating: number;
  posterUrl: string | null;
}
