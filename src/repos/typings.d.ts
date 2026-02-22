// GitHub API Types
// DOCS: https://docs.github.com/en/rest/search/search#search-repositories

export interface GitHubOwner {
  login: string;
  html_url: string;
}

export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url: string | null;
}

export interface GitHubRepoSearchResult {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubOwner;
  html_url: string;
  description: string | null;
  language: string | null;
  created_at: string;
  license: GitHubLicense | null;
}

export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepoSearchResult[];
}

// Normalized Output Types

export interface RepoData {
  name: string;
  fullName: string;
  ownerLogin: string;
  ownerUrl: string;
  description: string | null;
  language: string | null;
  createdAt: string;
  licenseName: string | null;
  url: string;
}

export interface RepoSearchResponse {
  results: RepoData[];
  totalResults: number;
  page: number;
}

export interface GitHubQueryOptions {
  language?: string;
  sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
  order?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}
