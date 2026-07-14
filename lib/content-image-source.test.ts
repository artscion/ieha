import { describe, expect, it } from 'vitest';
import { getCatalogueWorks, getFeaturedWork } from '@/lib/content';

describe('public catalogue image source', () => {
  it('never uses imageSourceUrl as the public image path', async () => {
    const works = await getCatalogueWorks('en');
    for (const work of works) {
      expect(work.image.startsWith('http')).toBe(false);
      if (work.image) {
        expect(work.image.startsWith('/catalogue/')).toBe(true);
      }
    }
  });

  it('featured work resolves to a local catalogue path when present', async () => {
    const featured = await getFeaturedWork('en', 'cubo-futurist-composition');
    if (featured) {
      expect(featured.image.startsWith('http')).toBe(false);
      expect(featured.image.startsWith('/catalogue/')).toBe(true);
    }
  });
});
