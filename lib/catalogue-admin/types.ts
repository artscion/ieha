export type CatalogueSort =
  | 'artist-asc'
  | 'artist-desc'
  | 'title-asc'
  | 'title-desc'
  | 'year-asc'
  | 'year-desc';

export const DEFAULT_SORT: CatalogueSort = 'artist-asc';
export const UNKNOWN_ARTIST = 'Unknown artist';

export type CatalogueAdminWork = {
  slug: string;
  title: string;
  artist: string;
  date: string;
  medium: string;
  hasImage: boolean;
  reviewStatus: string;
};

export type CatalogueQueryState = {
  q: string;
  artist: string;
  sort: CatalogueSort;
};
