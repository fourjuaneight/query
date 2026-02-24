import type { Context } from 'hono';

import type { Bindings } from '../common/typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { searchArtist, searchAlbum, searchTrack } from './discogs';

export const handleArtistSearch = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const name = ctx.req.query('name');
  if (!name) {
    return jsonError(ctx, 'Missing required query parameter: name');
  }

  const page = ctx.req.query('page');
  const perPage = ctx.req.query('per_page');

  try {
    const results = await searchArtist(ctx.env.DISCOGS_TOKEN, name, {
      ...(page && { page: parseInt(page, 10) }),
      ...(perPage && { perPage: parseInt(perPage, 10) }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleAlbumSearch = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const title = ctx.req.query('title');
  if (!title) {
    return jsonError(ctx, 'Missing required query parameter: title');
  }

  const artist = ctx.req.query('artist');
  const year = ctx.req.query('year');
  const genre = ctx.req.query('genre');
  const page = ctx.req.query('page');
  const perPage = ctx.req.query('per_page');

  try {
    const results = await searchAlbum(ctx.env.DISCOGS_TOKEN, title, {
      ...(artist && { artist }),
      ...(year && { year }),
      ...(genre && { genre }),
      ...(page && { page: parseInt(page, 10) }),
      ...(perPage && { perPage: parseInt(perPage, 10) }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};

export const handleTrackSearch = async (
  ctx: Context<{ Bindings: Bindings }>,
): Promise<Response> => {
  const track = ctx.req.query('track');
  if (!track) {
    return jsonError(ctx, 'Missing required query parameter: track');
  }

  const artist = ctx.req.query('artist');
  const year = ctx.req.query('year');
  const genre = ctx.req.query('genre');
  const page = ctx.req.query('page');
  const perPage = ctx.req.query('per_page');

  try {
    const results = await searchTrack(ctx.env.DISCOGS_TOKEN, track, {
      ...(artist && { artist }),
      ...(year && { year }),
      ...(genre && { genre }),
      ...(page && { page: parseInt(page, 10) }),
      ...(perPage && { perPage: parseInt(perPage, 10) }),
    });
    return jsonSuccess(ctx, results);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(ctx, message, 500);
  }
};
