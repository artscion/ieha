import { describe, it, expect } from 'vitest';
import { getHomeContent, getPageContent } from './lib/content';
import type { Locale, PageSlug } from './lib/content';

const LOCALES: Locale[] = ['fr', 'en', 'ru', 'de'];
const PAGE_SLUGS: PageSlug[] = ['about', 'methodology', 'research', 'programs', 'contact'];

describe('content completeness', () => {
  for (const locale of LOCALES) {
    it(`has non-empty home content for "${locale}"`, async () => {
      const content = await getHomeContent(locale);
      expect(content.eyebrow.length).toBeGreaterThan(0);
      expect(content.headline.length).toBeGreaterThan(0);
      expect(content.subhead.length).toBeGreaterThan(0);
    });

    for (const slug of PAGE_SLUGS) {
      it(`has non-empty "${slug}" content with at least one section for "${locale}"`, async () => {
        const content = await getPageContent(locale, slug);
        expect(content.title.length).toBeGreaterThan(0);
        expect(content.lead.length).toBeGreaterThan(0);
        expect(content.sections.length).toBeGreaterThan(0);
        for (const section of content.sections) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.body.length).toBeGreaterThan(0);
        }
      });
    }
  }
});
