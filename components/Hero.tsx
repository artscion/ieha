import type { HeroSlide, HomeContent } from '@/lib/content';
import { HeroSlideshow } from './HeroSlideshow';

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
  slides,
}: {
  content: HomeContent;
  slides: HeroSlide[];
}) {
  return (
    <main id="main-content" className="relative isolate min-h-[min(88vh,900px)] overflow-hidden">
      <HeroSlideshow slides={slides} />

      <div className="relative z-10 mx-auto flex min-h-[min(88vh,900px)] max-w-[1100px] flex-col justify-center px-6 py-20 sm:px-10">
        <div className="max-w-[34rem]">
          <p className="font-sans text-xs uppercase tracking-widest text-cream/75">{content.eyebrow}</p>
          <h1 className="mt-4 text-balance font-sans text-[clamp(2rem,1.2rem+2.8vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-cream">
            {content.headline}
          </h1>
          <p className="mt-5 max-w-[440px] font-serif text-base leading-relaxed text-cream/85">
            {renderSubhead(content.subhead)}
          </p>
        </div>
      </div>
    </main>
  );
}
