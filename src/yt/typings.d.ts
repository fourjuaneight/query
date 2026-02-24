// YouTube Data API v3 response types

export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default?: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
    high?: YouTubeThumbnail;
    standard?: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
  };
  channelTitle: string;
  tags?: string[];
  categoryId: string;
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeVideoSnippet;
}

export interface YouTubeVideoListResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// Normalized Output Types

export interface VideoData {
  title: string;
  creator: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  url: string;
}
