import { Genre } from '../common/typings';

// Common
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

// Normalized Output Types
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
