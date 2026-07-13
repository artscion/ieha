import Image from 'next/image';
import type { FeaturedWork, HomeContent } from '@/lib/content';

const LATIN_PHRASE = 'sine ira et studio';

function renderSubhead(subhead: string) {
  const idx = subhead.indexOf(LATIN_PHRASE);
  if (idx === -1) return subhead;
  const before = subhead.slice(0, idx);
  const after = subhead.slice(idx + LATIN_PHRASE.length);
  return (
    <>
      {before}
      <em>{LATIN_PHRASE}</em>
      {after}
    </>
  );
}

export function Hero({
  content,
  featured,
  imageWidth,
  imageHeight,
}: {
  content: HomeContent;
  featured?: FeaturedWork | null;
  imageWidth?: number;
  imageHeight?: number;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-[1100px] flex-col gap-12 px-6 py-14 sm:px-10 md:flex-row md:items-center md:gap-16"
    >
      <div className="md:flex-[1.15]">
        <p className="font-sans text-xs uppercase tracking-widest text-forest">{content.eyebrow}</p>
        <h1 className="mt-4 text-balance font-sans text-[clamp(2rem,1.2rem+2.8vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
          {content.headline}
        </h1>
        <p className="mt-5 max-w-[440px] font-serif text-base leading-relaxed text-ink-soft">
          {renderSubhead(content.subhead)}
        </p>
      </div>

      {featured?.image && imageWidth && imageHeight ? (
        <figure className="mx-auto w-full max-w-[260px] md:mx-0 md:max-w-[320px] md:flex-none">
          <Image
            src={featured.image}
            alt={`${featured.artist} — ${featured.title}, ${featured.medium}`}
            width={imageWidth}
            height={imageHeight}
            sizes="(min-width: 768px) 320px, 260px"
            priority
            className="h-auto w-full"
          />
          <figcaption className="mt-4 border-t border-border pt-3 font-sans text-[11px] uppercase tracking-wide text-label">
            {featured.artist} · <span className="text-ink-soft">{featured.title}</span>, {featured.date}
          </figcaption>
        </figure>
      ) : null}
    </main>
  );
}
