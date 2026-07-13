'use client';
import { useState } from 'react';
import { CatalogueFilter } from '@/components/CatalogueFilter';
import { CatalogueGrid } from '@/components/CatalogueGrid';
import type { CatalogueWork } from '@/lib/content';

export function CollectionBrowser({ works }: { works: CatalogueWork[] }) {
  const [filtered, setFiltered] = useState(works);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Collection</h1>
      <div className="mt-8 max-w-xs">
        <CatalogueFilter works={works} onFilteredChange={setFiltered} />
      </div>
      <div className="mt-8">
        <CatalogueGrid works={filtered} />
      </div>
    </main>
  );
}
