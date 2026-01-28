// TMDB
export interface Genre {
  id: number;
  name: string;
}

export interface TMDBQueryOptions {
  language?: string;
  year?: number;
  page?: number;
}
