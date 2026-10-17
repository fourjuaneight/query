import type {
  GitHubRepoSearchResult,
  GitHubSearchResponse,
  GitHubQueryOptions,
  RepoData,
  RepoSearchResponse,
} from './typings';
import { buildUrl, upstreamFetch } from '../common/helpers';

const GITHUB_API_URL = 'https://api.github.com';

/** GitHub search only exposes the first 1000 results */
const MAX_SEARCH_RESULTS = 1000;

/**
 * Make a request to the GitHub API
 * DOCS: https://docs.github.com/en/rest
 */
const githubFetch = async <T>(
  token: string,
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> =>
  upstreamFetch<T>('GitHub', buildUrl(`${GITHUB_API_URL}${endpoint}`, params), {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'QueryAPI/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

/**
 * Normalize a GitHub repo into a RepoData object
 */
const normalizeRepoData = (repo: GitHubRepoSearchResult): RepoData => ({
  name: repo.name,
  fullName: repo.full_name,
  ownerLogin: repo.owner.login,
  ownerUrl: repo.owner.html_url,
  description: repo.description ?? null,
  language: repo.language ?? null,
  createdAt: repo.created_at,
  licenseName: repo.license?.name ?? null,
  url: repo.html_url,
});

/**
 * Search for repositories by query
 * DOCS: https://docs.github.com/en/rest/search/search#search-repositories
 *
 * @param query - The search query
 * @param options - Optional query parameters (language, sort, order, page, perPage)
 * @returns Paginated list of matching repositories
 */
export const searchRepos = async (
  token: string,
  query: string,
  options: GitHubQueryOptions = {},
): Promise<RepoSearchResponse> => {
  const searchQuery = options.language
    ? `${query} language:${options.language}`
    : query;
  const perPage = options.perPage ?? 10;
  const page = options.page ?? 1;

  const response = await githubFetch<GitHubSearchResponse>(
    token,
    '/search/repositories',
    {
      ['q']: searchQuery,
      sort: options.sort ?? 'stars',
      order: options.order ?? 'desc',
      per_page: perPage,
      page,
    },
  );

  return {
    results: response.items.map(normalizeRepoData),
    totalResults: response.total_count,
    totalPages: Math.ceil(
      Math.min(response.total_count, MAX_SEARCH_RESULTS) / perPage,
    ),
    page,
  };
};

/**
 * Search for a repository by name and return the first (most relevant) result
 *
 * @param name - The repository name to search for
 * @returns Normalized repo data or null if not found
 */
export const queryRepo = async (
  token: string,
  name: string,
): Promise<RepoData | null> => {
  const { results } = await searchRepos(token, name, { perPage: 1 });
  return results[0] ?? null;
};
