import { config, fields, singleton, collection } from '@keystatic/core';

const LOCALES = ['fr', 'en', 'ru', 'de'] as const;
const PAGE_SLUGS = ['about', 'methodology', 'research', 'programs', 'contact'] as const;

function homeSingleton(locale: string) {
  return singleton({
    label: `Home (${locale})`,
    path: `content/pages/home/${locale}/`,
    schema: {
      eyebrow: fields.text({ label: 'Eyebrow' }),
      headline: fields.text({ label: 'Headline' }),
      subhead: fields.text({ label: 'Subhead', multiline: true }),
    },
  });
}

function prosePageSingleton(slug: string, locale: string) {
  return singleton({
    label: `${slug} (${locale})`,
    path: `content/pages/${slug}/${locale}/`,
    schema: {
      title: fields.text({ label: 'Title' }),
      lead: fields.text({ label: 'Lead', multiline: true }),
      sections: fields.array(
        fields.object({
          heading: fields.text({ label: 'Section heading' }),
          body: fields.text({ label: 'Section body', multiline: true }),
        }),
        { label: 'Sections', itemLabel: (props) => props.fields.heading.value || 'Section' }
      ),
    },
  });
}

const homeSingletons = Object.fromEntries(
  LOCALES.map((locale) => [`home_${locale}`, homeSingleton(locale)])
);

const proseSingletons = Object.fromEntries(
  PAGE_SLUGS.flatMap((slug) =>
    LOCALES.map((locale) => [`${slug}_${locale}`, prosePageSingleton(slug, locale)])
  )
);

export default config({
  storage: {
    kind: 'github',
    repo: 'artscion/ieha',
  },
  singletons: {
    ...homeSingletons,
    ...proseSingletons,
  },
  collections: {
    catalogue_works: collection({
      label: 'Catalogue works',
      slugField: 'title',
      path: 'content/catalogue/*',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        artist: fields.text({ label: 'Artist' }),
        date: fields.text({ label: 'Date / period' }),
        medium: fields.text({ label: 'Medium' }),
        image: fields.image({ label: 'Image', directory: 'public/catalogue', publicPath: '/catalogue/' }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: (props) => props.value }),
        sourceCitation: fields.text({ label: 'Source citation (which CATALOGUE_AVANTGARDE file this came from)' }),
        reviewStatus: fields.select({
          label: 'Review status',
          options: [
            { label: 'Draft (not shown publicly)', value: 'draft' },
            { label: 'Approved', value: 'approved' },
          ],
          defaultValue: 'draft',
        }),
        caption_fr: fields.text({ label: 'Caption (FR)', multiline: true }),
        caption_en: fields.text({ label: 'Caption (EN)', multiline: true }),
        caption_ru: fields.text({ label: 'Caption (RU)', multiline: true }),
        caption_de: fields.text({ label: 'Caption (DE)', multiline: true }),
      },
    }),
  },
});
