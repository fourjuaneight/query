import type { Context } from 'hono';

import type { AppEnv } from '../common/typings';
import { jsonSuccess } from '../common/helpers';
import { intQuery, optionalQuery, requireQuery } from '../common/params';
import { searchArtist, searchAlbum, searchTrack } from './discogs';

const pagination = (
  ctx: Context<AppEnv>,
): { page?: number; perPage?: number } => ({
  page: intQuery(ctx, 'page'),
  perPage: intQuery(ctx, 'per_page', { max: 100 }),
});

const filters = (
  ctx: Context<AppEnv>,
): { artist?: string; year?: string; genre?: string } => ({
  artist: optionalQuery(ctx, 'artist'),
  year: optionalQuery(ctx, 'year'),
  genre: optionalQuery(ctx, 'genre'),
});

export const handleArtistSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const name = requireQuery(ctx, 'name');

  const results = await searchArtist(
    ctx.env.DISCOGS_TOKEN,
    name,
    pagination(ctx),
  );
  return jsonSuccess(ctx, results);
};

export const handleAlbumSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');

  const results = await searchAlbum(ctx.env.DISCOGS_TOKEN, title, {
    ...filters(ctx),
    ...pagination(ctx),
  });
  return jsonSuccess(ctx, results);
};

export const handleTrackSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const track = requireQuery(ctx, 'track');

  const results = await searchTrack(ctx.env.DISCOGS_TOKEN, track, {
    ...filters(ctx),
    ...pagination(ctx),
  });
  return jsonSuccess(ctx, results);
};
