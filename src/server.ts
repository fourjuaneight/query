import { serve } from '@hono/node-server';

import app from './app';
import type { Bindings } from './common/typings';

const port = Number(process.env['PORT'] ?? 8787);

const env: Bindings = {
  TMDB_KEY: process.env['TMDB_KEY'] ?? '',
  IGDB_CLIENT_ID: process.env['IGDB_CLIENT_ID'] ?? '',
  IGDB_ACCESS_TOKEN: process.env['IGDB_ACCESS_TOKEN'] ?? '',
  DISCOGS_TOKEN: process.env['DISCOGS_TOKEN'] ?? '',
  GITHUB_TOKEN: process.env['GITHUB_TOKEN'] ?? '',
};

console.log(`Server running at http://localhost:${port}`);

serve({
  fetch: request => app.fetch(request, env),
  port,
});
