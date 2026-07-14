import { describe, expect, it } from 'vitest';
import { displayArtist, normalizeForCompare, parseSortableYear } from '@/lib/catalogue-admin/normalize';
import {
  applyCatalogueView,
  buildArtistOptions,
  filterCatalogueWorks,
  groupWorksByArtist,
  sortCatalogueWorks,
} from '@/lib/catalogue-admin/query';
import { parseCatalogueQuery, serializeCatalogueQuery } from '@/lib/catalogue-admin/query-state';
import type { CatalogueAdminWork } from '@/lib/catalogue-admin/types';

const works: CatalogueAdminWork[] = [
  {
    slug: 'guernica',
    title: 'Guernica',
    artist: 'Pablo Picasso',
    date: '1937',
    medium: 'Oil',
    hasImage: true,
    reviewStatus: 'approved',
  },
  {
    slug: 'dora',
    title: 'Portrait of Dora Maar',
    artist: 'Pablo Picasso',
    date: '1937',
    medium: 'Oil',
    hasImage: true,
    reviewStatus: 'approved',
  },
  {
    slug: 'sailboat',
    title: 'Sailboat',
    artist: 'Alexei Kruchenykh',
    date: 'ca. 1916',
    medium: 'Collage',
    hasImage: true,
    reviewStatus: 'draft',
  },
  {
    slug: 'untitled',
    title: 'Untitled',
    artist: '',
    date: 'date undetermined',
    medium: 'Unknown',
    hasImage: false,
    reviewStatus: 'draft',
  },
  {
    slug: 'nera',
    title: 'Gontcharova Nera',
    artist: 'Mikhail Larionov',
    date: 'ca. 1916',
    medium: 'Oil',
    hasImage: true,
    reviewStatus: 'draft',
  },
];

describe('normalizeForCompare', () => {
  it('strips diacritics and collapses whitespace', () => {
    expect(normalizeForCompare('  Clément   Redko ')).toBe('clement redko');
  });
});

describe('parseSortableYear', () => {
  it('reads years from free-text dates', () => {
    expect(parseSortableYear('1919')).toBe(1919);
    expect(parseSortableYear('ca. 1916')).toBe(1916);
    expect(parseSortableYear('1920-1922')).toBe(1920);
    expect(parseSortableYear('date undetermined')).toBeNull();
  });
});

describe('sortCatalogueWorks', () => {
  it('sorts Artist A–Z with title as secondary key', () => {
    const sorted = sortCatalogueWorks(works, 'artist-asc');
    expect(sorted.map((w) => w.slug)).toEqual([
      'sailboat',
      'nera',
      'guernica',
      'dora',
      'untitled',
    ]);
  });

  it('sorts Artist Z–A with title secondary', () => {
    const sorted = sortCatalogueWorks(works, 'artist-desc');
    expect(sorted.map((w) => displayArtist(w.artist))).toEqual([
      'Pablo Picasso',
      'Pablo Picasso',
      'Mikhail Larionov',
      'Alexei Kruchenykh',
      'Unknown artist',
    ]);
  });

  it('sorts by title A–Z and Z–A', () => {
    expect(sortCatalogueWorks(works, 'title-asc').map((w) => w.title)[0]).toBe(
      'Gontcharova Nera'
    );
    expect(sortCatalogueWorks(works, 'title-desc').map((w) => w.title)[0]).toBe('Untitled');
  });

  it('puts missing artists after named artists', () => {
    const sorted = sortCatalogueWorks(works, 'artist-asc');
    expect(sorted.at(-1)?.slug).toBe('untitled');
  });

  it('puts missing years after dated works', () => {
    const sorted = sortCatalogueWorks(works, 'year-asc');
    expect(sorted.at(-1)?.slug).toBe('untitled');
    // Both 1916 works come first; title is the secondary key.
    expect(sorted[0]?.slug).toBe('nera');
    expect(sorted[1]?.slug).toBe('sailboat');
  });

  it('does not mutate the original array', () => {
    const original = [...works];
    sortCatalogueWorks(works, 'title-desc');
    expect(works.map((w) => w.slug)).toEqual(original.map((w) => w.slug));
  });
});

describe('filterCatalogueWorks', () => {
  it('matches case-insensitive title and artist search', () => {
    const byTitle = filterCatalogueWorks(works, { q: 'GUERNICA', artist: '' });
    expect(byTitle.map((w) => w.slug)).toEqual(['guernica']);

    const byArtist = filterCatalogueWorks(works, { q: 'picasso', artist: '' });
    expect(byArtist.map((w) => w.slug).sort()).toEqual(['dora', 'guernica']);
  });

  it('matches diacritic-insensitive search', () => {
    const withAccent = [
      ...works,
      {
        slug: 'redko',
        title: 'Composition',
        artist: 'Clément Redko',
        date: '1919',
        medium: 'Mixed',
        hasImage: true,
        reviewStatus: 'approved',
      },
    ];
    const found = filterCatalogueWorks(withAccent, { q: 'clement', artist: '' });
    expect(found.map((w) => w.slug)).toEqual(['redko']);
  });

  it('filters by artist display name including Unknown artist', () => {
    const picasso = filterCatalogueWorks(works, { q: '', artist: 'Pablo Picasso' });
    expect(picasso).toHaveLength(2);

    const unknown = filterCatalogueWorks(works, { q: '', artist: 'Unknown artist' });
    expect(unknown.map((w) => w.slug)).toEqual(['untitled']);
  });

  it('combines search with artist filter', () => {
    const combined = filterCatalogueWorks(works, { q: 'portrait', artist: 'Pablo Picasso' });
    expect(combined.map((w) => w.slug)).toEqual(['dora']);

    const miss = filterCatalogueWorks(works, { q: 'sailboat', artist: 'Pablo Picasso' });
    expect(miss).toHaveLength(0);
  });
});

describe('buildArtistOptions / grouping', () => {
  it('lists distinct artists with counts, Unknown last', () => {
    const options = buildArtistOptions(works);
    expect(options.map((o) => `${o.name}:${o.count}`)).toEqual([
      'Alexei Kruchenykh:1',
      'Mikhail Larionov:1',
      'Pablo Picasso:2',
      'Unknown artist:1',
    ]);
  });

  it('groups consecutive works under artist headings after artist sort', () => {
    const sorted = applyCatalogueView(works, { q: '', artist: '', sort: 'artist-asc' });
    const groups = groupWorksByArtist(sorted);
    expect(groups.map((g) => g.artist)).toEqual([
      'Alexei Kruchenykh',
      'Mikhail Larionov',
      'Pablo Picasso',
      'Unknown artist',
    ]);
    expect(groups.find((g) => g.artist === 'Pablo Picasso')?.works.map((w) => w.title)).toEqual([
      'Guernica',
      'Portrait of Dora Maar',
    ]);
  });
});

describe('catalogue query state', () => {
  it('parses URL query params with default sort', () => {
    expect(parseCatalogueQuery(new URLSearchParams('q=picasso&artist=Pablo%20Picasso'))).toEqual({
      q: 'picasso',
      artist: 'Pablo Picasso',
      sort: 'artist-asc',
    });
    expect(parseCatalogueQuery(new URLSearchParams('sort=year-desc')).sort).toBe('year-desc');
    expect(parseCatalogueQuery(new URLSearchParams('sort=nope')).sort).toBe('artist-asc');
  });

  it('omits default/empty values when serializing', () => {
    expect(serializeCatalogueQuery({ q: '', artist: '', sort: 'artist-asc' })).toBe('');
    expect(serializeCatalogueQuery({ q: ' a ', artist: '', sort: 'title-asc' })).toBe(
      'q=a&sort=title-asc'
    );
  });
});
