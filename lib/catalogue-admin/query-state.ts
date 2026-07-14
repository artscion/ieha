import { DEFAULT_SORT, type CatalogueQueryState, type CatalogueSort } from './types';

const SORT_VALUES: readonly CatalogueSort[] = [
  'artist-asc',
  'artist-desc',
  'title-asc',
  'title-desc',
  'year-asc',
  'year-desc',
] as const;

export function isCatalogueSort(value: string | null | undefined): value is CatalogueSort {
  return !!value && (SORT_VALUES as readonly string[]).includes(value);
}

export function parseCatalogueQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): CatalogueQueryState {
  const get = (key: string): string => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? '';
    }
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0] ?? '';
    return raw ?? '';
  };

  const sortRaw = get('sort');
  return {
    q: get('q'),
    artist: get('artist'),
    sort: isCatalogueSort(sortRaw) ? sortRaw : DEFAULT_SORT,
  };
}

/** Build query string omitting defaults/empty values. */
export function serializeCatalogueQuery(state: CatalogueQueryState): string {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set('q', state.q.trim());
  if (state.artist.trim()) params.set('artist', state.artist.trim());
  if (state.sort !== DEFAULT_SORT) params.set('sort', state.sort);
  return params.toString();
}
