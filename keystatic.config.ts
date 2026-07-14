import { config, fields, singleton, collection } from '@keystatic/core';
import {
  catalogueImageField,
  catalogueImageSourceUrlField,
} from './lib/keystatic/catalogue-image-field';

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
  ui: {
    navigation: {
      Catalogue: ['catalogue_works'],
      'Home pages': ['home_fr', 'home_en', 'home_ru', 'home_de'],
      Content: [
        'about_fr',
        'about_en',
        'about_ru',
        'about_de',
        'methodology_fr',
        'methodology_en',
        'methodology_ru',
        'methodology_de',
        'research_fr',
        'research_en',
        'research_ru',
        'research_de',
        'programs_fr',
        'programs_en',
        'programs_ru',
        'programs_de',
        'contact_fr',
        'contact_en',
        'contact_ru',
        'contact_de',
      ],
    },
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
      columns: ['title', 'artist', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        artist: fields.text({ label: 'Artist' }),
        date: fields.text({ label: 'Date / period' }),
        medium: fields.text({ label: 'Medium' }),
        image: catalogueImageField({
          label: 'Image (upload)',
          description: 'Upload a file, or use Import from URL below. Stored in the repository.',
          directory: 'public/catalogue',
          publicPath: '/catalogue/',
        }),
        imageSourceUrl: catalogueImageSourceUrlField(),
        showInHero: fields.checkbox({
          label: 'Show in homepage hero',
          description: 'Include this artwork in the slow slideshow on the homepage.',
          defaultValue: false,
        }),
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
