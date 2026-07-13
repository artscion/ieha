import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

export type Locale = 'fr' | 'en' | 'ru' | 'de';
export type PageSlug = 'about' | 'methodology' | 'research' | 'programs' | 'contact';

export type HomeContent = {
  eyebrow: string;
  headline: string;
  subhead: string;
};

export type PageContent = {
  title: string;
  lead: string;
  sections: { heading: string; body: string }[];
};

export type CatalogueWork = {
  slug: string;
  title: string;
  artist: string;
  date: string;
  medium: string;
  image: string;
  tags: string[];
  caption: string;
  sourceCitation: string;
};

const CAPTION_FIELD: Record<Locale, 'caption_fr' | 'caption_en' | 'caption_ru' | 'caption_de'> = {
  fr: 'caption_fr',
  en: 'caption_en',
  ru: 'caption_ru',
  de: 'caption_de',
};

export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  const key = `home_${locale}` as keyof typeof reader.singletons;
  const entry = (await reader.singletons[key].read()) as HomeContent | null;
  if (!entry) throw new Error(`Missing home content for locale "${locale}"`);
  return { eyebrow: entry.eyebrow, headline: entry.headline, subhead: entry.subhead };
}

export async function getPageContent(locale: Locale, slug: PageSlug): Promise<PageContent> {
  const key = `${slug}_${locale}` as keyof typeof reader.singletons;
  const entry = (await reader.singletons[key].read()) as
    | { title: string; lead: string; sections: readonly { heading: string; body: string }[] }
    | null;
  if (!entry) throw new Error(`Missing "${slug}" content for locale "${locale}"`);
  return {
    title: entry.title,
    lead: entry.lead,
    sections: entry.sections.map((s: { heading: string; body: string }) => ({
      heading: s.heading,
      body: s.body,
    })),
  };
}

export async function getCatalogueWorks(locale: Locale): Promise<CatalogueWork[]> {
  const slugs = await reader.collections.catalogue_works.list();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await reader.collections.catalogue_works.read(slug);
      return entry ? { slug, entry } : null;
    })
  );

  const captionField = CAPTION_FIELD[locale];

  return entries
    .filter((e): e is { slug: string; entry: NonNullable<typeof e>['entry'] } => e !== null)
    .filter(({ entry }) => entry.reviewStatus === 'approved')
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      artist: entry.artist,
      date: entry.date,
      medium: entry.medium,
      image: entry.image ?? '',
      tags: [...entry.tags],
      caption: entry[captionField],
      sourceCitation: entry.sourceCitation,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
