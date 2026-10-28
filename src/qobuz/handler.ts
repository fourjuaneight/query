import type { Context } from 'hono';

import type { AppEnv, Bindings } from '../common/typings';
import type { QobuzCredentials } from './typings';
import { jsonError, jsonSuccess } from '../common/helpers';
import { intQuery, optionalQuery, requireQuery } from '../common/params';
import { STORE, searchAlbums } from './qobuz';

export const qobuzCredentials = (env: Bindings): QobuzCredentials => ({
  appId: env.QOBUZ_APP_ID,
  userAuthToken: env.QOBUZ_USER_AUTH_TOKEN,
});

export const handleQobuzAlbumSearch = async (
  ctx: Context<AppEnv>,
): Promise<Response> => {
  const title = requireQuery(ctx, 'title');
  const store = optionalQuery(ctx, 'store')?.toLowerCase();
  if (store !== undefined && !STORE.test(store)) {
    return jsonError(
      ctx,
      'Invalid query parameter: store (expected a region-language code such as us-en)',
    );
  }

  const results = await searchAlbums(qobuzCredentials(ctx.env), title, {
    artist: optionalQuery(ctx, 'artist'),
    store,
    limit: intQuery(ctx, 'limit', { max: 50 }),
    offset: intQuery(ctx, 'offset', { min: 0, max: 10000 }),
  });
  return jsonSuccess(ctx, results);
};
