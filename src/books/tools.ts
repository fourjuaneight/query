import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

import {
  READ_ONLY,
  int,
  optionalText,
  page,
  runTool,
  text,
} from '../mcp/helpers';
import { queryBookByISBN, searchBooksByTitle } from './openlibrary';

export const registerBookTools = (server: McpServer): void => {
  server.registerTool(
    'get_book_by_isbn',
    {
      title: 'Get book by ISBN',
      description:
        'Look up one book on OpenLibrary by ISBN-10 or ISBN-13. Returns title, authors, publishers, first publish year, page count, ISBNs and cover.',
      inputSchema: z.object({ isbn: text('ISBN-10 or ISBN-13') }),
      annotations: READ_ONLY,
    },
    ({ isbn }) =>
      runTool(() => queryBookByISBN(isbn), `No book found for ISBN: ${isbn}`),
  );

  server.registerTool(
    'search_books',
    {
      title: 'Search books',
      description:
        'Search OpenLibrary for books by title. Returns a list of matching books.',
      inputSchema: z.object({
        title: text('Book title to search for'),
        limit: int('Maximum number of results (default 10)', { max: 100 }),
        page: page(),
        language: optionalText('Language code to filter by (e.g. "eng")'),
      }),
      annotations: READ_ONLY,
    },
    ({ title, ...options }) =>
      runTool(() => searchBooksByTitle(title, options)),
  );
};
