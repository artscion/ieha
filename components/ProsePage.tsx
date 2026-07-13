import type { PageContent } from '@/lib/content';

export function ProsePage({ content }: { content: PageContent }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold">{content.title}</h1>
      <p className="mt-4 text-lg text-neutral-600">{content.lead}</p>
      <div className="mt-12 space-y-10">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-medium">{section.heading}</h2>
            <p className="mt-3 whitespace-pre-line text-neutral-700">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
