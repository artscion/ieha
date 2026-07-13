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
      <span className="text-sm font-medium">Filter by artist</span>
      <select
        aria-label="Filter by artist"
        value={artist}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 block"
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
