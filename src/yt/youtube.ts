import type { YouTubeVideoListResponse, VideoData } from './typings';
import { buildUrl, upstreamFetch } from '../common/helpers';

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
): Promise<T> =>
  upstreamFetch<T>(
    'YouTube',
    buildUrl(`${YOUTUBE_API_URL}${endpoint}`, { key: apiKey, ...params }),
    { headers: { Accept: 'application/json' } },
  );

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
  const videoId = extractVideoId(input);

  const response = await youtubeFetch<YouTubeVideoListResponse>(
    apiKey,
    '/videos',
    {
      id: videoId,
      part: 'snippet',
    },
  );

  const item = response.items?.[0];
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
};
