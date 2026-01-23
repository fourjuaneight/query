// TMDB API Response Types

// Common Types
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

export interface Genre {
  id: number;
  name: string;
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

// TV Show Types
export interface TMDBTVSearchResult {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBTVSearchResponse {
  page: number;
  results: TMDBTVSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBTVSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  overview: string;
  poster_path: string | null;
}

export interface TMDBTVCreatedBy {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  original_name: string;
  first_air_date: string;
  last_air_date: string;
  overview: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres: Genre[];
  poster_path: string | null;
  backdrop_path: string | null;
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
  created_by: TMDBTVCreatedBy[];
  seasons: TMDBTVSeason[];
  aggregate_credits?: {
    cast: TVCastMember[];
    crew: TVCrewMember[];
  };
}

export interface TVCastMember {
  id: number;
  name: string;
  roles: {
    character: string;
    episode_count: number;
  }[];
  total_episode_count: number;
  order: number;
  profile_path: string | null;
}

export interface TVCrewMember {
  id: number;
  name: string;
  jobs: {
    job: string;
    episode_count: number;
  }[];
  department: string;
  total_episode_count: number;
  profile_path: string | null;
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

export interface TVShowData {
  id: number;
  title: string;
  firstAirDate: string;
  lastAirDate: string;
  creators: string[];
  cast: string[];
  genres: string[];
  seasonCount: number;
  episodeCount: number;
  overview: string;
  rating: number;
  status: string;
  posterUrl: string | null;
}

// Query Options
export interface TMDBQueryOptions {
  language?: string;
  year?: number;
  page?: number;
}
