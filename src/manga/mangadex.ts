import { Context } from 'hono';

import { AuthorResponse, MangaResponse } from './typings';

export interface MangaData {
  title: string;
  description: string;
  author: string;
  year: number;
  status: string;
  cover: string;
  url: string;
}

const API = 'https://api.mangadex.org';
const ASSETS = 'https://uploads.mangadex.org';

export const getMangaAuthor = async (
  ctx: Context,
  id: string,
): Promise<string> => {
  try {
    const request = await fetch(`${API}/author/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MangaDex-API/1.0',
      },
    });

    if (request.status !== 200) {
      const errorResp = await request.text();

      throw `[fetch]: ${request.status} - ${request.statusText} (${id}) - ${errorResp}`;
    }

    const response: AuthorResponse = await request.json();

    return response.data.attributes.name;
  } catch (error) {
    console.log(`[getMangaAuthor] - ${error}`);
    throw `[getMangaAuthor] - ${error}`;
  }
};

export const getMangaDetails = async (
  ctx: Context,
  id: string,
  url: string,
): Promise<MangaData> => {
  try {
    const request = await fetch(
      `${API}/manga/${id}?limit=100&includes%5B%5D=cover_art&includes%5B%5D=scanlation_group&order%5Bvolume%5D=desc&order%5Bchapter%5D=desc&offset=0&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&contentRating%5B%5D=pornographic&translatedLanguage%5B%5D=en`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MangaDex-API/1.0',
        },
      },
    );

    if (request.status !== 200) {
      const errorResp = await request.text();

      throw `[fetch]: ${request.status} - ${request.statusText} (${id}) - ${errorResp}`;
    }

    const response: MangaResponse = await request.json();
    const {
      data: { attributes, relationships },
    } = response;
    const coverFile = relationships?.find(rel => rel.type === 'cover_art')
      ?.attributes?.fileName;
    const author = await getMangaAuthor(ctx, relationships[0].id);

    return {
      title: attributes.title.en,
      description: attributes.description.en,
      author,
      year: attributes.year,
      status: attributes.status,
      cover: `${ASSETS}/covers/${id}/${coverFile}`,
      url,
    };
  } catch (error) {
    console.log(`[getMangaDetails] - ${error}`);
    throw `[getMangaDetails] - ${error}`;
  }
};
