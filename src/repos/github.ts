import type {
  GitHubRepoSearchResult,
  GitHubSearchResponse,
  GitHubQueryOptions,
  RepoData,
  RepoSearchResponse,
} from './typings';
import { UpstreamError, buildUrl, upstreamFetch } from '../common/helpers';

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
  const sort = options.sort ?? 'stars';
  const perPage = options.perPage ?? 10;
  const page = options.page ?? 1;

  const response = await githubFetch<GitHubSearchResponse>(
    token,
    '/search/repositories',
    {
      ['q']: searchQuery,
      ...(sort !== 'best-match' && { sort, order: options.order ?? 'desc' }),
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
 * Get a repository by name.
 * "owner/repo" is fetched directly; anything else returns the best search match.
 * DOCS: https://docs.github.com/en/rest/repos/repos#get-a-repository
 *
 * @param name - The repository name ("owner/repo" or a bare name)
 * @returns Normalized repo data or null if not found
 */
export const queryRepo = async (
  token: string,
  name: string,
): Promise<RepoData | null> => {
  const [owner, repo, ...rest] = name.split('/');

  if (owner && repo && rest.length === 0) {
    try {
      const result = await githubFetch<GitHubRepoSearchResult>(
        token,
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      );
      return normalizeRepoData(result);
    } catch (error) {
      if (error instanceof UpstreamError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  const { results } = await searchRepos(token, name, {
    sort: 'best-match',
    perPage: 1,
  });
  return results[0] ?? null;
};
