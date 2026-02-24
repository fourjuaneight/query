import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { Bindings } from './common/typings';
import { handleBookByISBN, handleBookSearch } from './books/handler';
import {
  handleGameSearch,
  handleGameQuery,
  handleGameById,
} from './games/handler';
import { handleMangaDetails, handleMangaSearch } from './manga/handler';
import {
  handleMovieQuery,
  handleMovieById,
  handleMovieSearch,
} from './movies/handler';
import { handleMTGCard } from './mtg/handler';
import {
  handleArtistSearch,
  handleAlbumSearch,
  handleTrackSearch,
} from './music/handler';
import { handlePKMCard } from './pkm/handler';
import { handleRepoSearch, handleRepoQuery } from './repos/handler';
import {
  handleTVShowQuery,
  handleTVShowById,
  handleTVShowSearch,
} from './shows/handler';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', ctx => ctx.text('Why are you here?'));

// --- Books ---
app.get('/books/isbn', async ctx => handleBookByISBN(ctx));
app.get('/books/search', async ctx => handleBookSearch(ctx));

// --- Games ---
app.get('/games/search', async ctx => handleGameSearch(ctx));
app.get('/games/query', async ctx => handleGameQuery(ctx));
app.get('/games/:id', async ctx => handleGameById(ctx));

// --- Manga ---
app.get('/manga/search', async ctx => handleMangaSearch(ctx));
app.get('/manga/:id', async ctx => handleMangaDetails(ctx));

// --- Movies ---
app.get('/movies/query', async ctx => handleMovieQuery(ctx));
app.get('/movies/search', async ctx => handleMovieSearch(ctx));
app.get('/movies/:id', async ctx => handleMovieById(ctx));

// --- MTG ---
app.get('/mtg/cards', async ctx => handleMTGCard(ctx));

// --- Music ---
app.get('/music/artists', async ctx => handleArtistSearch(ctx));
app.get('/music/albums', async ctx => handleAlbumSearch(ctx));
app.get('/music/tracks', async ctx => handleTrackSearch(ctx));

// --- Pokémon TCG ---
app.get('/pkm/cards', async ctx => handlePKMCard(ctx));

// --- Repos ---
app.get('/repos/search', async ctx => handleRepoSearch(ctx));
app.get('/repos/query', async ctx => handleRepoQuery(ctx));

// --- TV Shows ---
app.get('/shows/query', async ctx => handleTVShowQuery(ctx));
app.get('/shows/search', async ctx => handleTVShowSearch(ctx));
app.get('/shows/:id', async ctx => handleTVShowById(ctx));

// 404 handler
app.notFound(ctx => ctx.json({ success: false, error: 'Not Found' }, 404));

// Error handler
app.onError((err, ctx) => {
  console.error(`[app] - ${err.message}`);
  return ctx.json({ success: false, error: err.message }, 500);
});

export default app;
