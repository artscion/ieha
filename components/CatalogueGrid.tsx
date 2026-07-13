import Image from 'next/image';
import type { CatalogueWork } from '@/lib/content';

export function CatalogueGrid({ works }: { works: CatalogueWork[] }) {
  if (works.length === 0) {
    return <p className="text-neutral-500">No approved works match this filter yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {works.map((work) => (
        <figure key={work.slug}>
          <Image src={work.image} alt={work.title} width={400} height={400} className="w-full object-cover" />
          <figcaption className="mt-2">
            <p className="font-medium">
              {work.artist} — {work.title}
            </p>
            <p className="text-sm text-neutral-500">
              {work.date} · {work.medium}
            </p>
            <p className="mt-1 text-sm text-neutral-700">{work.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
