import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';
import type { CatalogueAdminWork } from './types';

const reader = createReader(process.cwd(), keystaticConfig);

export async function listCatalogueAdminWorks(): Promise<CatalogueAdminWork[]> {
  const slugs = await reader.collections.catalogue_works.list();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await reader.collections.catalogue_works.read(slug);
      if (!entry) return null;
      const work: CatalogueAdminWork = {
        slug,
        title: entry.title,
        artist: entry.artist,
        date: entry.date,
        medium: entry.medium,
        hasImage: Boolean(entry.image),
        reviewStatus: entry.reviewStatus,
      };
      return work;
    })
  );

  return entries.filter((e): e is CatalogueAdminWork => e !== null);
}
