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
    <header className="mx-auto max-w-4xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-neutral-500">{content.eyebrow}</p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight">{content.headline}</h1>
      <p className="mt-6 text-lg text-neutral-600">{renderSubhead(content.subhead)}</p>
    </header>
  );
}
