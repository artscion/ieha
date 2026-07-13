import type { HomeContent } from '@/lib/content';

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

export function Hero({ content }: { content: HomeContent }) {
  return (
    <header className="mx-auto flex max-w-[1100px] flex-col gap-10 px-10 py-14 md:flex-row md:items-center">
      <div className="flex-[1.3]">
        <p className="font-sans text-xs uppercase tracking-widest text-forest">{content.eyebrow}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-ink md:text-[34px]">{content.headline}</h1>
        <p className="mt-5 max-w-[420px] font-serif text-base leading-relaxed text-ink-soft">
          {renderSubhead(content.subhead)}
        </p>
      </div>
      <div className="hidden md:flex md:flex-1 md:items-center md:border-l md:border-border md:pl-10 md:min-h-[180px]" aria-hidden="true" />
    </header>
  );
}
