import { displayArtist, normalizeForCompare, parseSortableYear } from './normalize';
import {
  DEFAULT_SORT,
  UNKNOWN_ARTIST,
  type CatalogueAdminWork,
  type CatalogueQueryState,
  type CatalogueSort,
} from './types';

export type ArtistOption = {
  name: string;
  count: number;
};

function compareText(a: string, b: string): number {
  return normalizeForCompare(a).localeCompare(normalizeForCompare(b), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

function compareArtist(a: CatalogueAdminWork, b: CatalogueAdminWork): number {
  const aName = displayArtist(a.artist);
  const bName = displayArtist(b.artist);
  const aUnknown = aName === UNKNOWN_ARTIST;
  const bUnknown = bName === UNKNOWN_ARTIST;
  if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
  return compareText(aName, bName);
}

function compareTitle(a: CatalogueAdminWork, b: CatalogueAdminWork): number {
  return compareText(a.title, b.title);
}

function compareYear(
  a: CatalogueAdminWork,
  b: CatalogueAdminWork,
  direction: 'asc' | 'desc'
): number {
  const aYear = parseSortableYear(a.date);
  const bYear = parseSortableYear(b.date);
  const aMissing = aYear === null;
  const bMissing = bYear === null;
  if (aMissing !== bMissing) return aMissing ? 1 : -1;
  if (aYear === null || bYear === null) return compareTitle(a, b);
  const diff = direction === 'asc' ? aYear - bYear : bYear - aYear;
  if (diff !== 0) return diff;
  return compareTitle(a, b);
}

export function sortCatalogueWorks(
  works: readonly CatalogueAdminWork[],
  sort: CatalogueSort = DEFAULT_SORT
): CatalogueAdminWork[] {
  const copy = [...works];
  copy.sort((a, b) => {
    switch (sort) {
      case 'artist-asc': {
        const byArtist = compareArtist(a, b);
        return byArtist !== 0 ? byArtist : compareTitle(a, b);
      }
      case 'artist-desc': {
        const aName = displayArtist(a.artist);
        const bName = displayArtist(b.artist);
        const aUnknown = aName === UNKNOWN_ARTIST;
        const bUnknown = bName === UNKNOWN_ARTIST;
        // Keep unknown artists at the end even when reversing A–Z.
        if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
        const byArtist = compareText(bName, aName);
        return byArtist !== 0 ? byArtist : compareTitle(a, b);
      }
      case 'title-asc':
        return compareTitle(a, b);
      case 'title-desc':
        return compareTitle(b, a);
      case 'year-asc':
        return compareYear(a, b, 'asc');
      case 'year-desc':
        return compareYear(a, b, 'desc');
      default:
        return compareArtist(a, b) || compareTitle(a, b);
    }
  });
  return copy;
}

export function matchesSearch(work: CatalogueAdminWork, query: string): boolean {
  const q = normalizeForCompare(query);
  if (!q) return true;
  const haystack = normalizeForCompare(
    `${work.title} ${displayArtist(work.artist)} ${work.slug}`
  );
  return haystack.includes(q);
}

export function filterCatalogueWorks(
  works: readonly CatalogueAdminWork[],
  state: Pick<CatalogueQueryState, 'q' | 'artist'>
): CatalogueAdminWork[] {
  const artistFilter = state.artist.trim();
  return works.filter((work) => {
    if (!matchesSearch(work, state.q)) return false;
    if (!artistFilter) return true;
    return displayArtist(work.artist) === artistFilter;
  });
}

export function applyCatalogueView(
  works: readonly CatalogueAdminWork[],
  state: CatalogueQueryState
): CatalogueAdminWork[] {
  return sortCatalogueWorks(filterCatalogueWorks(works, state), state.sort);
}

export function buildArtistOptions(works: readonly CatalogueAdminWork[]): ArtistOption[] {
  const counts = new Map<string, number>();
  for (const work of works) {
    const name = displayArtist(work.artist);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const aUnknown = a.name === UNKNOWN_ARTIST;
      const bUnknown = b.name === UNKNOWN_ARTIST;
      if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
      return compareText(a.name, b.name);
    });
}

export function groupWorksByArtist(
  works: readonly CatalogueAdminWork[]
): { artist: string; works: CatalogueAdminWork[] }[] {
  const groups: { artist: string; works: CatalogueAdminWork[] }[] = [];
  for (const work of works) {
    const artist = displayArtist(work.artist);
    const last = groups[groups.length - 1];
    if (last && last.artist === artist) {
      last.works.push(work);
    } else {
      groups.push({ artist, works: [work] });
    }
  }
  return groups;
}
