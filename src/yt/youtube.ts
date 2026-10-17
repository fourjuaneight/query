import type { YouTubeVideoListResponse, VideoData } from './typings';
import { buildUrl, upstreamFetch } from '../common/helpers';

const YOUTUBE_API_URL = 'https://youtube.googleapis.com/youtube/v3';

const VIDEO_ID = /^[\w-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'youtube-nocookie.com']);

/**
 * Extract a YouTube video ID from a URL or raw ID string
 *
 * Supports:
 * - https://youtu.be/<id>[?si=...]
 * - https://(www|m|music).youtube.com/watch?v=<id>[&...]
 * - https://www.youtube.com/(shorts|embed|live|v)/<id>
 * - Raw video ID
 *
 * @returns The 11-character video ID, or null if none can be found
 */
export const extractVideoId = (input: string): string | null => {
  const trimmed = input.trim();
  if (VIDEO_ID.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let candidate: string | null | undefined;

  if (host === 'youtu.be') {
    candidate = url.pathname.split('/')[1];
  } else if (YOUTUBE_HOSTS.has(host)) {
    candidate =
      url.searchParams.get('v') ??
      url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/]+)/)?.[1];
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
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
 * Get video details by video ID
 * DOCS: https://developers.google.com/youtube/v3/docs/videos/list
 *
 * @param apiKey - The YouTube Data API key from env bindings
 * @param videoId - A YouTube video ID (see extractVideoId)
 * @returns Normalized video data or null if not found
 */
export const queryVideo = async (
  apiKey: string,
  videoId: string,
): Promise<VideoData | null> => {
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
