import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { AppEnv } from './common/typings';
import { errorResponse } from './common/helpers';
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
import { handleVideoQuery } from './yt/handler';

const app = new Hono<AppEnv>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', ctx => ctx.text('Why are you here?'));

// --- Books ---
app.get('/books/isbn', handleBookByISBN);
app.get('/books/search', handleBookSearch);

// --- Games ---
app.get('/games/search', handleGameSearch);
app.get('/games/query', handleGameQuery);
app.get('/games/:id', handleGameById);

// --- Manga ---
app.get('/manga/search', handleMangaSearch);
app.get('/manga/:id', handleMangaDetails);

// --- Movies ---
app.get('/movies/query', handleMovieQuery);
app.get('/movies/search', handleMovieSearch);
app.get('/movies/:id', handleMovieById);

// --- MTG ---
app.get('/mtg/cards', handleMTGCard);

// --- Music ---
app.get('/music/artists', handleArtistSearch);
app.get('/music/albums', handleAlbumSearch);
app.get('/music/tracks', handleTrackSearch);

// --- Pokémon TCG ---
app.get('/pkm/cards', handlePKMCard);

// --- Repos ---
app.get('/repos/search', handleRepoSearch);
app.get('/repos/query', handleRepoQuery);

// --- TV Shows ---
app.get('/shows/query', handleTVShowQuery);
app.get('/shows/search', handleTVShowSearch);
app.get('/shows/:id', handleTVShowById);

// --- YouTube ---
app.get('/yt/video', handleVideoQuery);

// 404 handler
app.notFound(ctx => ctx.json({ success: false, error: 'Not Found' }, 404));

// Error handler
app.onError(errorResponse);

export default app;
