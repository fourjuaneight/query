import { serve } from '@hono/node-server';

import app from './app';
import type { Bindings } from './common/typings';

const port = Number(process.env['PORT'] ?? 8787);

const env: Bindings = {
  TMDB_KEY: process.env['TMDB_KEY'] ?? '',
  TWITCH_CLIENT_ID: process.env['TWITCH_CLIENT_ID'] ?? '',
  TWITCH_CLIENT_SECRET: process.env['TWITCH_CLIENT_SECRET'] ?? '',
  DISCOGS_TOKEN: process.env['DISCOGS_TOKEN'] ?? '',
  GH_TOKEN: process.env['GH_TOKEN'] ?? '',
  YOUTUBE_KEY: process.env['YOUTUBE_KEY'] ?? '',
};

console.log(`Server running at http://localhost:${port}`);

serve({
  fetch: request => app.fetch(request, env),
  port,
});
