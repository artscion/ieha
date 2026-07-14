import { describe, expect, it } from 'vitest';
import {
  HERO_FALLBACK_LIMIT,
  formatHeroCaption,
  selectHeroSlides,
  type CatalogueHeroCandidate,
} from './hero-slides';

const resolve = (image: string) => (image.startsWith('/') ? image : `/catalogue/${image}`);

function work(partial: Partial<CatalogueHeroCandidate> & Pick<CatalogueHeroCandidate, 'slug' | 'title'>): CatalogueHeroCandidate {
  return {
    artist: 'Artist',
    date: '1919',
    image: `${partial.slug}.jpg`,
    reviewStatus: 'approved',
    showInHero: false,
    ...partial,
  };
}

describe('selectHeroSlides', () => {
  it('excludes catalogue entries without images', () => {
    const slides = selectHeroSlides(
      [
        work({ slug: 'a', title: 'A', image: null }),
        work({ slug: 'b', title: 'B', image: 'b.jpg' }),
      ],
      resolve
    );
    expect(slides.map((s) => s.id)).toEqual(['b']);
  });

  it('excludes external hotlinks from the hero', () => {
    const slides = selectHeroSlides(
      [
        work({ slug: 'hot', title: 'Hot', image: 'https://cdn.example.org/a.jpg' }),
        work({ slug: 'local', title: 'Local', image: '/catalogue/local/image.jpg' }),
      ],
      resolve
    );
    expect(slides.map((s) => s.id)).toEqual(['local']);
    expect(slides[0].imageSrc.startsWith('http')).toBe(false);
  });

  it('prefers explicit showInHero works', () => {
    const slides = selectHeroSlides(
      [
        work({ slug: 'alpha', title: 'Alpha', artist: 'Zed', showInHero: false }),
        work({ slug: 'beta', title: 'Beta', artist: 'Ann', showInHero: true }),
        work({ slug: 'gamma', title: 'Gamma', artist: 'Ann', showInHero: true }),
      ],
      resolve
    );
    expect(slides.map((s) => s.id)).toEqual(['beta', 'gamma']);
  });

  it('falls back to approved works when none are selected', () => {
    const slides = selectHeroSlides(
      [
        work({ slug: 'sail', title: 'Sailboat', artist: 'Alexei', showInHero: false }),
        work({ slug: 'cubo', title: 'Cubo', artist: 'Clement', showInHero: false }),
        work({ slug: 'drafty', title: 'Draft', reviewStatus: 'draft' }),
      ],
      resolve
    );
    expect(slides.map((s) => s.id)).toEqual(['sail', 'cubo']);
  });

  it('excludes unpublished entries even when showInHero is true', () => {
    const slides = selectHeroSlides(
      [
        work({ slug: 'draft', title: 'Draft', reviewStatus: 'draft', showInHero: true }),
        work({ slug: 'ok', title: 'Ok', showInHero: false }),
      ],
      resolve
    );
    expect(slides.map((s) => s.id)).toEqual(['ok']);
  });

  it('limits fallback selection', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      work({
        slug: `w-${String(i).padStart(2, '0')}`,
        title: `Title ${String(i).padStart(2, '0')}`,
        artist: 'Same',
      })
    );
    const slides = selectHeroSlides(many, resolve, { fallbackLimit: 5 });
    expect(slides).toHaveLength(5);
    expect(HERO_FALLBACK_LIMIT).toBe(12);
  });

  it('sorts by artist then title', () => {
    const slides = selectHeroSlides(
      [
        work({ slug: '2', title: 'Zebra', artist: 'Ann' }),
        work({ slug: '1', title: 'Apple', artist: 'Ann' }),
        work({ slug: '3', title: 'Moon', artist: 'Bob' }),
      ],
      resolve
    );
    expect(slides.map((s) => s.id)).toEqual(['1', '2', '3']);
  });

  it('normalizes local image paths through the resolver', () => {
    const slides = selectHeroSlides(
      [work({ slug: 'x', title: 'X', image: 'x.jpg' })],
      resolve
    );
    expect(slides[0].imageSrc).toBe('/catalogue/x.jpg');
  });

  it('builds alt text from title and artist', () => {
    const slides = selectHeroSlides(
      [work({ slug: 'x', title: 'Composition', artist: 'Redko' })],
      resolve
    );
    expect(slides[0].alt).toBe('Composition by Redko');
  });
});

describe('formatHeroCaption', () => {
  it('omits missing metadata gracefully', () => {
    expect(formatHeroCaption({ title: 'Only Title' })).toBe('Only Title');
    expect(formatHeroCaption({ artist: 'Only Artist', title: 'T' })).toBe('Only Artist — T');
    expect(formatHeroCaption({ artist: 'A', title: 'T', year: '1919' })).toBe('A — T, 1919');
    expect(formatHeroCaption({ title: '' })).toBe('');
  });
});
