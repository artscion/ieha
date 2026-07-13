'use client';
import { useState } from 'react';
import { CatalogueFilter } from '@/components/CatalogueFilter';
import { CatalogueGrid } from '@/components/CatalogueGrid';
import type { CatalogueWork } from '@/lib/content';

export function CollectionBrowser({ works }: { works: CatalogueWork[] }) {
  const [filtered, setFiltered] = useState(works);

  return (
    <main id="main-content" className="mx-auto max-w-[1100px] px-6 py-16 sm:px-10">
      <h1 className="text-balance font-sans text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">Collection</h1>
      <div className="mt-8 max-w-xs">
        <CatalogueFilter works={works} onFilteredChange={setFiltered} />
      </div>
      <div className="mt-8">
        <CatalogueGrid works={filtered} />
      </div>
    </main>
  );
}
