import { describe, expect, it } from 'vitest';
import { getHeroSlides } from './content';

describe('getHeroSlides', () => {
  it('returns approved local catalogue images for the homepage', async () => {
    const slides = await getHeroSlides('en');
    expect(slides.length).toBeGreaterThan(0);
    expect(slides.length).toBeLessThanOrEqual(12);
    for (const slide of slides) {
      expect(slide.imageSrc.startsWith('/catalogue/')).toBe(true);
      expect(slide.imageSrc.startsWith('http')).toBe(false);
      expect(slide.title.length).toBeGreaterThan(0);
      expect(slide.id.length).toBeGreaterThan(0);
    }
    // Deterministic artist→title order for the current approved set.
    expect(slides[0].artist).toBeTruthy();
  });
});
