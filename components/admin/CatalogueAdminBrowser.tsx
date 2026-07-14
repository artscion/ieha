'use client';

import { useCallback, useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  applyCatalogueView,
  buildArtistOptions,
  groupWorksByArtist,
} from '@/lib/catalogue-admin/query';
import { parseCatalogueQuery, serializeCatalogueQuery } from '@/lib/catalogue-admin/query-state';
import {
  DEFAULT_SORT,
  type CatalogueAdminWork,
  type CatalogueSort,
} from '@/lib/catalogue-admin/types';
import { displayArtist } from '@/lib/catalogue-admin/normalize';

const SORT_OPTIONS: { value: CatalogueSort; label: string }[] = [
  { value: 'artist-asc', label: 'Artist A–Z, then Title A–Z' },
  { value: 'artist-desc', label: 'Artist Z–A, then Title A–Z' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
  { value: 'year-asc', label: 'Year: oldest first' },
  { value: 'year-desc', label: 'Year: newest first' },
];

function editorHref(slug: string, branch: string): string {
  return `/keystatic/branch/${encodeURIComponent(branch)}/collection/catalogue_works/item/${encodeURIComponent(slug)}`;
}

export function CatalogueAdminBrowser({ works }: { works: CatalogueAdminWork[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const branch =
    searchParams.get('branch')?.trim() ||
    process.env.NEXT_PUBLIC_KEYSTATIC_BRANCH ||
    'feat/site-rebuild';

  const state = useMemo(
    () => parseCatalogueQuery(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const updateState = useCallback(
    (patch: Partial<typeof state>) => {
      const next = { ...state, ...patch };
      const qs = serializeCatalogueQuery(next);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, state]
  );

  const filtered = useMemo(() => applyCatalogueView(works, state), [works, state]);
  const artistOptions = useMemo(() => buildArtistOptions(works), [works]);
  const groups = useMemo(() => {
    const artistSorted = state.sort === 'artist-asc' || state.sort === 'artist-desc';
    return artistSorted ? groupWorksByArtist(filtered) : null;
  }, [filtered, state.sort]);

  const hasFilters =
    state.q.trim() !== '' || state.artist.trim() !== '' || state.sort !== DEFAULT_SORT;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <p className="font-sans text-xs uppercase tracking-widest text-forest">Keystatic admin</p>
        <h1 className="mt-2 font-sans text-2xl font-semibold tracking-tight text-ink">
          Catalogue works
        </h1>
        <p className="mt-2 max-w-2xl font-serif text-sm text-ink-soft">
          Browse by artist, search, and open an entry in the standard Keystatic editor. Default
          order is artist then title.
        </p>
        <p className="mt-3 font-sans text-sm">
          <a href="/keystatic" className="text-forest underline-offset-2 hover:underline">
            ← Back to Keystatic
          </a>
          {' · '}
          <a
            href={
              branch
                ? `/keystatic/branch/${encodeURIComponent(branch)}/collection/catalogue_works`
                : '/keystatic/collection/catalogue_works'
            }
            className="text-forest underline-offset-2 hover:underline"
          >
            Standard collection list
          </a>
        </p>
      </header>

      <div
        className="mb-6 flex flex-col gap-3 rounded border border-border bg-cream p-4 sm:flex-row sm:flex-wrap sm:items-end"
        role="search"
        aria-label="Catalogue filters"
      >
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-wide text-label">
          Search
          <input
            type="search"
            value={state.q}
            onChange={(e) => updateState({ q: e.target.value })}
            placeholder="Title or artist"
            className="rounded border border-border bg-white px-3 py-2 font-sans text-sm normal-case tracking-normal text-ink outline-none ring-forest focus:ring-2"
          />
        </label>

        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-wide text-label">
          Artist
          <select
            value={state.artist}
            onChange={(e) => updateState({ artist: e.target.value })}
            className="rounded border border-border bg-white px-3 py-2 font-sans text-sm normal-case tracking-normal text-ink outline-none ring-forest focus:ring-2"
          >
            <option value="">All artists</option>
            {artistOptions.map((opt) => (
              <option key={opt.name} value={opt.name}>
                {opt.name} ({opt.count})
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[14rem] flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-wide text-label">
          Sort
          <select
            value={state.sort}
            onChange={(e) => updateState({ sort: e.target.value as CatalogueSort })}
            className="rounded border border-border bg-white px-3 py-2 font-sans text-sm normal-case tracking-normal text-ink outline-none ring-forest focus:ring-2"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => updateState({ q: '', artist: '', sort: DEFAULT_SORT })}
          disabled={!hasFilters}
          className="rounded border border-border px-3 py-2 font-sans text-sm text-ink enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>

      <p className="mb-4 font-sans text-sm text-label" aria-live="polite">
        {filtered.length} result{filtered.length === 1 ? '' : 's'}
        {filtered.length !== works.length ? ` (of ${works.length})` : ''}
      </p>

      {filtered.length === 0 ? (
        <p className="font-serif italic text-ink-soft">No artworks match these filters.</p>
      ) : groups ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.artist} aria-labelledby={`artist-${group.artist}`}>
              <h2
                id={`artist-${group.artist}`}
                className="mb-3 border-b border-border pb-2 font-sans text-sm font-semibold uppercase tracking-wide text-forest"
              >
                {group.artist}
              </h2>
              <WorkTable works={group.works} branch={branch} hideArtist />
            </section>
          ))}
        </div>
      ) : (
        <WorkTable works={filtered} branch={branch} />
      )}
    </div>
  );
}

function WorkTable({
  works,
  branch,
  hideArtist = false,
}: {
  works: CatalogueAdminWork[];
  branch: string;
  hideArtist?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border font-sans text-xs uppercase tracking-wide text-label">
            <th className="py-2 pr-4 font-medium">Title</th>
            {!hideArtist && <th className="py-2 pr-4 font-medium">Artist</th>}
            <th className="py-2 pr-4 font-medium">Year</th>
            <th className="py-2 pr-4 font-medium">Image</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {works.map((work) => (
            <tr key={work.slug} className="border-b border-border/70">
              <td className="py-3 pr-4 font-serif text-ink">
                <a
                  href={editorHref(work.slug, branch)}
                  className="text-ink underline-offset-2 hover:underline"
                >
                  {work.title}
                </a>
              </td>
              {!hideArtist && (
                <td className="py-3 pr-4 font-sans text-sm text-ink-soft">
                  {displayArtist(work.artist)}
                </td>
              )}
              <td className="py-3 pr-4 font-sans text-sm text-ink-soft">{work.date || '—'}</td>
              <td className="py-3 pr-4 font-sans text-sm text-ink-soft">
                {work.hasImage ? 'Yes' : 'Missing'}
              </td>
              <td className="py-3 font-sans text-sm capitalize text-ink-soft">
                {work.reviewStatus}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
