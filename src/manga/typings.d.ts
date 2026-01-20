export interface NameOrTitle {
  en: string;
}

export interface TagsAttributes {
  name: NameOrTitle;
  description?: string;
  group: string;
  version: number;
}

export interface TagsEntity {
  id: string;
  type: string;
  attributes: TagsAttributes;
  relationships?: any[];
}

export interface AltTitlesEntity {
  ja?: string | null;
  zh?: string | null;
  ru?: string | null;
  fa?: string | null;
}

export interface Description {
  en: string;
  ru: string;
  'pt-br': string;
}

export interface Links {
  al: string;
  ap: string;
  bw: string;
  kt: string;
  mu: string;
  amz: string;
  cdj: string;
  ebj: string;
  mal: string;
  raw: string;
  engtl: string;
}

export interface MangaAttributes {
  title: NameOrTitle;
  altTitles?: AltTitlesEntity[] | null;
  description: Description;
  isLocked: boolean;
  links: Links;
  originalLanguage: string;
  lastVolume: string;
  lastChapter: string;
  publicationDemographic: string;
  status: string;
  year: number;
  contentRating: string;
  tags?: TagsEntity[] | null;
  state: string;
  chapterNumbersResetOnNewVolume: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  availableTranslatedLanguages?: string[];
  latestUploadedChapter: string;
}

export interface RelationshipsAttributes {
  description: string;
  volume: string;
  fileName: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RelationshipsEntity {
  id: string;
  type: string;
  attributes?: RelationshipsAttributes;
}

export interface MangaData {
  id: string;
  type: string;
  attributes: MangaAttributes;
  relationships?: RelationshipsEntity[];
}

export interface MangaResponse {
  result: string;
  response: string;
  data: MangaData;
}

export interface AuthorAttributes {
  name: string;
  imageUrl?: null;
  biography: any;
  twitter?: null;
  pixiv?: null;
  melonBook?: null;
  fanBox?: null;
  booth?: null;
  nicoVideo?: null;
  skeb?: null;
  fantia?: null;
  tumblr?: null;
  youtube?: null;
  weibo?: null;
  naver?: null;
  website?: null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AuthorData {
  id: string;
  type: string;
  attributes: AuthorAttributes;
  relationships?: RelationshipsEntity[];
}

export interface AuthorResponse {
  result: string;
  response: string;
  data: AuthorData;
}
