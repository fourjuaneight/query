import type { YouTubeVideoListResponse, VideoData } from './typings';
import { parseJSON } from '../common/helpers';

const YOUTUBE_API_URL = 'https://youtube.googleapis.com/youtube/v3';

/**
 * Extract a YouTube video ID from a URL or raw ID string
 *
 * Supports:
 * - https://youtu.be/<id>
 * - https://www.youtube.com/watch?v=<id>
 * - https://youtube.com/watch?v=<id>
 * - Raw video ID
 */
const extractVideoId = (input: string): string => {
  return input
    .replace(/(https?:\/\/)(www\.)?(youtu.*)\.(be|com)\/(watch\?v=)?/g, '')
    .replace(/&.*$/, '');
};

/**
 * Make a request to the YouTube Data API v3
 * DOCS: https://developers.google.com/youtube/v3/docs
 */
const youtubeFetch = async <T>(
  apiKey: string,
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  try {
    const url = new URL(`${YOUTUBE_API_URL}${endpoint}`);
    url.searchParams.set('key', apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (networkError) {
      throw new Error(
        `(youtubeFetch): Network error requesting ${endpoint} - ${String(networkError)}`,
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
    throw new Error(`(youtubeFetch): ${String(error)}`);
  }
};

/**
 * Get video details by URL or video ID
 * DOCS: https://developers.google.com/youtube/v3/docs/videos/list
 *
 * @param apiKey - The YouTube Data API key from env bindings
 * @param input - A YouTube video URL or raw video ID
 * @returns Normalized video data or null if not found
 */
export const queryVideo = async (
  apiKey: string,
  input: string,
): Promise<VideoData | null> => {
  try {
    const videoId = extractVideoId(input);

    const response = await youtubeFetch<YouTubeVideoListResponse>(
      apiKey,
      '/videos',
      {
        id: videoId,
        part: 'snippet',
      },
    );

    if (!response.items || response.items.length === 0) {
      return null;
    }

    const item = response.items[0];
    if (!item) return null;

    const { snippet } = item;

    return {
      title: snippet.title,
      creator: snippet.channelTitle,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      thumbnailUrl:
        snippet.thumbnails.maxres?.url ??
        snippet.thumbnails.high?.url ??
        snippet.thumbnails.medium?.url ??
        snippet.thumbnails.default?.url ??
        null,
      url: `https://youtu.be/${videoId}`,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[queryVideo] - ${error.message}`);
      throw error;
    }
    const err = new Error(`[queryVideo] - ${String(error)}`);
    console.error(err.message);
    throw err;
  }
};
