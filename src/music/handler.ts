import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonSuccess } from '../common/helpers';
import {
  boolQuery,
  intQuery,
  optionalQuery,
  requireQuery,
} from '../common/params';
import {
  MAX_ALBUMS_PER_PAGE,
  searchAlbum,
  searchArtist,
  searchTrack,
} from './deezer';

const pagination = (
  ctx: Context<AppEnv>,
  maxPerPage = 100,
): { page?: number; perPage?: number } => ({
  page: intQuery(ctx, 'page'),
  perPage: intQuery(ctx, 'per_page', { max: maxPerPage }),
});

export const handleArtistSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const name = requireQuery(ctx, 'name');

  const results = await searchArtist(name, pagination(ctx));
  return jsonSuccess(ctx, results);
};

export const handleAlbumSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');

  const results = await searchAlbum(title, {
    artist: optionalQuery(ctx, 'artist'),
    details: boolQuery(ctx, 'details'),
    ...pagination(ctx, MAX_ALBUMS_PER_PAGE),
  });
  return jsonSuccess(ctx, results);
};

export const handleTrackSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const track = requireQuery(ctx, 'track');

  const results = await searchTrack(track, {
    artist: optionalQuery(ctx, 'artist'),
    ...pagination(ctx),
  });
  return jsonSuccess(ctx, results);
};
