import { describe, expect, it } from 'vitest';
import { listCatalogueAdminWorks } from './load';

describe('listCatalogueAdminWorks', () => {
  it('loads all catalogue yaml entries from disk', async () => {
    const works = await listCatalogueAdminWorks();
    expect(works.length).toBeGreaterThanOrEqual(10);
    expect(works.some((w) => w.slug === 'cubo-futurist-composition')).toBe(true);
    const redko = works.find((w) => w.slug === 'cubo-futurist-composition');
    expect(redko?.artist).toBe('Clement Redko');
    expect(redko?.title).toContain('Cubo-Futurist');
    expect(redko?.reviewStatus).toBe('approved');
  });
});
