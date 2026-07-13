import type { PageContent } from '@/lib/content';

export function ProsePage({ content }: { content: PageContent }) {
  return (
    <main className="mx-auto max-w-[1100px] px-10 py-16">
      <div className="max-w-[680px]">
        <h1 className="font-serif text-4xl text-ink">{content.title}</h1>
        <p className="mt-4 font-serif text-lg text-ink-soft">{content.lead}</p>
        <div className="mt-12 space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="border-t border-forest pt-3 font-serif text-2xl text-ink">{section.heading}</h2>
              <p className="mt-3 whitespace-pre-line font-serif text-base leading-relaxed text-ink-soft">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
