import type { PageContent } from '@/lib/content';

export function ProsePage({ content }: { content: PageContent }) {
  return (
    <main id="main-content" className="mx-auto max-w-[1100px] px-6 py-16 sm:px-10">
      <div className="max-w-[680px]">
        <h1 className="text-balance font-sans text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
          {content.title}
        </h1>
        <p className="mt-4 text-pretty font-serif text-lg leading-relaxed text-ink-soft">{content.lead}</p>
        <div className="mt-12 space-y-10">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-balance border-t border-forest pt-3 font-sans text-2xl font-semibold tracking-[-0.01em] text-ink">{section.heading}</h2>
              <p className="mt-3 whitespace-pre-line text-pretty font-serif text-base leading-relaxed text-ink-soft">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
