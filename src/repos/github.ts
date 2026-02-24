import type {
  GitHubSearchResponse,
  GitHubQueryOptions,
  RepoData,
  RepoSearchResponse,
} from './typings';
import { parseJSON } from '../common/helpers';

const GITHUB_API_URL = 'https://api.github.com';

/**
 * Make a request to the GitHub API
 * DOCS: https://docs.github.com/en/rest
 */
const githubFetch = async <T>(
  token: string,
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  try {
    const url = new URL(`${GITHUB_API_URL}${endpoint}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
    } catch (networkError) {
      throw new Error(
        `(githubFetch): Network error requesting ${endpoint} - ${String(networkError)}`,
      );
    }

    if (response.status !== 200) {
      const errorResp = await response.text();
      throw new Error(
        `(fetch): ${response.status} - ${response.statusText} (${endpoint}) - ${errorResp}`,
      );
    }

    return parseJSON<T>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`(githubFetch): ${String(error)}`);
  }
};

/**
 * Normalize a GitHub repo search result into a RepoData object
 */
const normalizeRepoData = (
  repo: GitHubSearchResponse['items'][number],
): RepoData => ({
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
  try {
    const searchQuery = options.language
      ? `${query} language:${options.language}`
      : query;

    const response = await githubFetch<GitHubSearchResponse>(
      token,
      '/search/repositories',
      {
        ['q']: searchQuery,
        sort: options.sort ?? 'stars',
        order: options.order ?? 'desc',
        per_page: options.perPage ?? 10,
        page: options.page ?? 1,
      },
    );

    return {
      results: response.items.map(normalizeRepoData),
      totalResults: response.total_count,
      page: options.page ?? 1,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[searchRepos] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[searchRepos] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
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
  try {
    const response = await searchRepos(token, name, { perPage: 1 });

    if (response.results.length === 0) {
      return null;
    }

    const first = response.results[0];
    if (!first) return null;

    return first;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[queryRepo] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[queryRepo] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};
