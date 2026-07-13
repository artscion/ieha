import Image from 'next/image';
import type { CatalogueWork } from '@/lib/content';

export function CatalogueGrid({ works }: { works: CatalogueWork[] }) {
  if (works.length === 0) {
    return <p className="font-serif italic text-ink-soft">No approved works match this filter yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {works.map((work) => (
        <figure key={work.slug} className="border-t border-border pt-4">
          <Image
            src={work.image}
            alt={`${work.artist} — ${work.title}, ${work.medium}`}
            width={800}
            height={800}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-auto w-full"
          />
          <figcaption className="mt-3">
            <p className="font-serif text-ink">
              {work.artist} — {work.title}
            </p>
            <p className="font-sans text-xs uppercase tracking-wide text-label">
              {work.date} · {work.medium}
            </p>
            <p className="mt-1 font-serif text-sm text-ink-soft">{work.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
