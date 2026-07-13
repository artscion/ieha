'use client';
import { useState, useMemo } from 'react';
import type { CatalogueWork } from '@/lib/content';

export function CatalogueFilter({
  works,
  onFilteredChange,
}: {
  works: CatalogueWork[];
  onFilteredChange: (filtered: CatalogueWork[]) => void;
}) {
  const [artist, setArtist] = useState('');
  const artists = useMemo(() => Array.from(new Set(works.map((w) => w.artist))).sort(), [works]);

  function handleChange(value: string) {
    setArtist(value);
    const filtered = value ? works.filter((w) => w.artist === value) : works;
    onFilteredChange(filtered);
  }

  return (
    <label className="block">
      <span className="font-sans text-xs uppercase tracking-wide text-label">Filter by artist</span>
      <select
        aria-label="Filter by artist"
        value={artist}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 block border-b border-border bg-transparent font-serif text-ink focus:border-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        <option value="">All artists</option>
        {artists.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </label>
  );
}
